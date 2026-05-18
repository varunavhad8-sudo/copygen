
const { generateWithOpenAI } = require('./openai.service');
const { generateWithClaude } = require('./claude.service');
const { classifyWithGemini, generateWithGemini, generateLongForm } = require('./gemini.service');
const { getBrandContext } = require('./brandMemory.service');

const TASK_TYPES = {
  LONG_FORM: 'LONG_FORM',
  SHORT_FORM: 'SHORT_FORM',
  BACKGROUND: 'BACKGROUND'
};

const TOKEN_LIMITS = {
  standard: {
    longForm: 11000,
    shortForm: 10000,
    routing: 512,
    background: 512
  },
  premium: {
    longForm: 11000,
    shortForm: 10000,
    routing: 512,
    background: 512
  }
};

// Real API model identifiers (as of 2025)
const MODEL_COSTS = {
  'gemini-2.5-pro': 0.010,
  'gemini-2.0-flash': 0.002,
};

const estimateTokens = (text) => {
  if (!text) return 0;
  // Professional heuristic: characters / 4 for standard English
  return Math.ceil(text.length / 4);
};

// Check which AI keys are real (not dummy/missing)
const hasAnthropicKey = process.env.ANTHROPIC_API_KEY &&
  !process.env.ANTHROPIC_API_KEY.includes('dummy');
const hasOpenAIKey = process.env.OPENAI_API_KEY &&
  !process.env.OPENAI_API_KEY.includes('dummy');
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

const classifyTask = async (briefText, contentType) => {
  const ct = (contentType || '').toLowerCase().replace(/[^a-z]/g, '');
  console.log('[classifyTask] normalized contentType:', { contentType: ct });

  const longFormTypes = ['blogpost', 'blog', 'report', 'seobrief', 'seoblog', 'longform'];
  const shortFormTypes = ['adcopy', 'ad', 'email', 'emailsequence', 'caption', 'social', 'socialcaption', 'socialpost', 'instagram', 'twitter', 'linkedin', 'facebook'];

  let classification;
  if (longFormTypes.includes(ct)) {
    classification = TASK_TYPES.LONG_FORM;
  } else if (shortFormTypes.includes(ct)) {
    classification = TASK_TYPES.SHORT_FORM;
  } else {
    // Internal routing decision uses Gemini
    const prompt = `Classify this content request into exactly one word. Reply with only LONG_FORM or SHORT_FORM.\nRequest: "${briefText}"`;
    classification = await classifyWithGemini(prompt);
  }

  console.log(`[classifyTask] classification result: ${classification}`, { contentType: ct });
  return classification;
};

const getModelForTask = (taskType) => {
  if (taskType === TASK_TYPES.LONG_FORM) return 'gemini-2.5-pro';
  if (taskType === TASK_TYPES.SHORT_FORM) return 'gemini-2.0-flash';
  return 'gemini-2.0-flash';
};

const calculateCost = (model, wordCount) => {
  const estimatedTokens = wordCount * 1.3;
  return (estimatedTokens / 1000) * (MODEL_COSTS[model] || 0.002);
};

const generateText = async ({ model, system, user, maxTokens, responseMimeType, contentType, finalTaskType }) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

  const getProviderName = (m) => {
    if (m.includes('claude')) return 'Anthropic';
    if (m.includes('gpt')) return 'OpenAI';
    if (m.includes('gemini')) return 'Google';
    return 'Unknown';
  };

  const primaryProvider = getProviderName(model);
  const primaryStartTime = Date.now();

  // Try the primary model
  try {
    if (model.includes('claude') && hasAnthropicKey) {
      console.log(`[LLMRouter] Using Anthropic: ${model}`);
      const text = await generateWithClaude({ system, user, model, maxTokens });
      console.log(`[LLM] Provider: Anthropic | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: true`);
      return { generatedText: text, modelUsed: model };
    }
    if ((model.includes('gpt')) && hasOpenAIKey) {
      console.log(`[LLMRouter] Using OpenAI: ${model}`);
      const text = await generateWithOpenAI({ system, user, model, maxTokens });
      console.log(`[LLM] Provider: OpenAI | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: true`);
      return { generatedText: text, modelUsed: model };
    }
  } catch (error) {
    console.log(`[LLM] Provider: ${primaryProvider} | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: false`);
    console.error(`❌ [LLMRouter] Primary model ${model} failed! Falling back to Gemini. Error: ${error.message}`);
  }

  // Default: Gemini Fallback
  const fallbackModel = model?.startsWith('gemini') ? model : 'gemini-3.1-pro-preview';
  const fallbackStartTime = Date.now();
  try {
    console.log(`[LLMRouter] Using Gemini: ${fallbackModel} (primary or fallback)`);
    console.log(`[LLMRouter TEST LOG] finalTaskType: ${finalTaskType}, maxTokens: ${maxTokens}, contentType: ${contentType}`);
    result = await generateWithGemini({
      user,
      system,
      model: fallbackModel,
      maxTokens,
      responseMimeType,
      contentType
    });
    // gemini service already returns { text, modelUsed }
    console.log(`[LLM] Provider: Google | Model: ${result.modelUsed} | Duration: ${Date.now() - fallbackStartTime}ms | Success: true`);
    return { generatedText: result.text, modelUsed: result.modelUsed };
  } catch (err) {
    console.log(`[LLM] Provider: Google | Model: ${fallbackModel} | Duration: ${Date.now() - fallbackStartTime}ms | Success: false`);
    throw err;
  }
};

const processRequest = async ({ brief, additionalContext, toneOverride, userPlan, clientId, userId, responseMimeType, variations = 1 }) => {
  // 1. Safety Check: Estimate input volume
  const inputTokens = estimateTokens(brief.briefText) +
    estimateTokens(additionalContext) +
    estimateTokens(toneOverride);

  const inputLimit = ['agency', 'enterprise'].includes(userPlan) ? 20000 : 8000;
  if (inputTokens > inputLimit) {
    const error = new Error(`Input too long — please shorten your input (Limit: ${inputLimit} chars)`);
    error.status = 400;
    throw error;
  }

  const taskType = await classifyTask(brief.briefText, brief.contentType);
  const finalTaskType = brief.contentType === 'seo' ? TASK_TYPES.LONG_FORM : taskType;

  let systemPrompt = await getBrandContext(clientId, userId, userPlan);
  const model = getModelForTask(finalTaskType);
  const finalModel = brief.contentType === 'seo' ? 'gemini-2.5-flash' : model;

  // 2. Inject per-request task context into system prompt
  let taskBlock = `
═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════
Content Type: ${brief.contentType || 'Not specified'}
Platform / Format: ${brief.platform || 'Not specified'}
Word Count / Length: ${brief.length || 'Not specified'}
Goal: ${brief.goal || 'Not specified'}
Number of Variations: ${variations}

CRITICAL INSTRUCTIONS:
- You MUST provide exactly ${variations} distinct variations of the content.
- Separate each variation with the marker: === VARIATION ===
- Do not include any commentary, meta-talk, or explanations. 
- Do not repeat the instructions or the brand memory descriptions.
- Start directly with the first variation.
- Ensure every sentence is complete and the thought is fully finished.
`;

  if (brief.contentType === 'seo') {
    taskBlock += `
SEO FORMAT REQUIREMENTS (MANDATORY):
- TONE & STYLE: Relatable for Indian college students. Avoid flowery language. Clear and scannable is the goal.
- Line 1: SEO Title: (under 60 characters, contains primary keyword)
- Line 2: Meta Description: (under 155 characters, contains keyword + CTA)
- Line 3: Target Keywords: Primary keyword + 3 secondary keywords
- Line 4 onwards: Full article body with:
  * One H1 heading containing the primary keyword
  * H2 subheadings every 150-200 words
  * Primary keyword in the first 100 words
  * Brand name mentioned 2-3 times naturally throughout
  * Paragraphs max 3-4 lines each
  * One CTA at the end
- Last line: Slug: (lowercase-hyphenated, keyword-rich)
- Do NOT output a plain essay. Structure is mandatory.
`;
  }

  taskBlock += `\nExecute the task in the user message. Follow every rule without exception.`;

  systemPrompt = systemPrompt + taskBlock;

  // 3. Determine maxTokens based on plan and task
  const planKey = ['agency', 'enterprise'].includes(userPlan) ? 'premium' : 'standard';

  let maxTokens;
  switch (finalTaskType) {
    case TASK_TYPES.LONG_FORM:
      maxTokens = TOKEN_LIMITS[planKey].longForm;
      break;
    case TASK_TYPES.SHORT_FORM:
      maxTokens = TOKEN_LIMITS[planKey].shortForm;
      break;
    case TASK_TYPES.BACKGROUND:
      maxTokens = TOKEN_LIMITS[planKey].background;
      break;
    default:
      maxTokens = TOKEN_LIMITS[planKey].routing;
  }

  // 4. Assemble the final user prompt
  let finalUserPrompt = brief.briefText;
  if (toneOverride && toneOverride !== 'Brand default') {
    finalUserPrompt += `\n\nTONE REQUIREMENT: ${toneOverride}`;
  }
  if (additionalContext) {
    finalUserPrompt += `\n\nADDITIONAL CONTEXT / INSTRUCTIONS:\n${additionalContext}`;
  }

  console.log('\n=============================================');
  console.log('            COMPILED SYSTEM PROMPT            ');
  console.log('=============================================');
  console.log(systemPrompt);
  console.log('=============================================\n');

  // 5. Race the generation against a timeout (120s for long-form/SEO)
  const timeoutMs = 120000; 
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('Generation timed out. The AI provider is taking too long to respond.');
      err.status = 504;
      reject(err);
    }, timeoutMs);
  });

  const { generatedText, modelUsed: actualModelUsed } = await Promise.race([
    generateText({
      model: finalModel,
      system: systemPrompt,
      user: finalUserPrompt,
      maxTokens,
      responseMimeType,
      contentType: brief.contentType,
      finalTaskType
    }),
    timeoutPromise
  ]);

  const generatedWordCount = generatedText.trim().split(/\s+/).length;
  const apiCost = calculateCost(actualModelUsed, generatedWordCount);

  const result = { generatedText, modelUsed: actualModelUsed, taskType: finalTaskType, generatedWordCount, apiCost };

  // 6. Handle multiple variations if requested
  if (variations > 1 && result.generatedText) {
    const parts = result.generatedText.split('=== VARIATION ===')
      .map(p => p.trim())
      .filter(p => p.length > 10); 
    
    if (parts.length > 0) {
      return parts.map(text => ({
        ...result,
        generatedText: text,
        generatedWordCount: text.split(/\s+/).length
      }));
    }
  }

  return result;
};

module.exports = { processRequest };


