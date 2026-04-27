const { generateWithOpenAI } = require('./openai.service');
const { generateWithClaude } = require('./claude.service');
const { classifyWithGemini, generateWithGemini } = require('./gemini.service');
const { getBrandContext } = require('./brandMemory.service');

const TASK_TYPES = {
  LONG_FORM: 'LONG_FORM',
  SHORT_FORM: 'SHORT_FORM',
  BACKGROUND: 'BACKGROUND'
};

const TOKEN_LIMITS = {
  standard: {
    longForm: 4000,   // Claude Sonnet 4.6
    shortForm: 512,   // GPT-4o
    routing: 256,     // GPT-4o Mini
    background: 256   // Gemini 2.5 Flash
  },
  premium: {
    longForm: 5000,   // Claude Sonnet 4.6
    shortForm: 800,   // GPT-4o — enough for multi-variation requests without padding
    routing: 256,     // GPT-4o Mini
    background: 256   // Gemini 2.5 Flash
  }
};

// Real API model identifiers (as of 2025)
const MODEL_COSTS = {
  'claude-sonnet-4-6-20251022': 0.003,    // Anthropic — long-form
  'gemini-2.5-flash': 0.000075, // Google — background tasks
  'gpt-4o': 0.005,    // OpenAI — short-form
  'gpt-4o-mini': 0.00015   // OpenAI — classification
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

  const longFormTypes = ['blogpost', 'blog', 'report', 'seobrief', 'seoblog'];
  const shortFormTypes = ['adcopy', 'ad', 'email', 'caption', 'social'];

  if (longFormTypes.includes(ct)) return TASK_TYPES.LONG_FORM;
  if (shortFormTypes.includes(ct)) return TASK_TYPES.SHORT_FORM;

  if (hasOpenAIKey) {
    const prompt = `Classify this content request into exactly one word. Reply with only LONG_FORM or SHORT_FORM.\nRequest: "${briefText}"`;
    // Internal routing decision uses GPT-4o Mini
    const text = await generateWithOpenAI({
      user: prompt,
      model: 'gpt-4o-mini',
      maxTokens: 10
    });
    const classification = text.trim().toUpperCase();
    if (classification.includes('LONG_FORM')) return TASK_TYPES.LONG_FORM;
    return TASK_TYPES.SHORT_FORM;
  }

  return TASK_TYPES.SHORT_FORM;
};

const getModelForTask = (taskType) => {
  switch (taskType) {
    case TASK_TYPES.LONG_FORM:
      return hasAnthropicKey ? 'claude-sonnet-4-6-20251022' : 'gemini-2.5-flash';
    case TASK_TYPES.SHORT_FORM:
      return hasOpenAIKey ? 'gpt-4o' : 'gemini-2.5-flash';
    case TASK_TYPES.BACKGROUND:
      // Background jobs, queue processing, metadata tagging
      return hasGeminiKey ? 'gemini-2.5-flash' : 'gpt-4o-mini';
    default:
      return 'gemini-2.5-flash';
  }
};

const calculateCost = (model, wordCount) => {
  const estimatedTokens = wordCount * 1.3;
  return (estimatedTokens / 1000) * (MODEL_COSTS[model] || 0.002);
};

const generateText = async ({ model, system, user, maxTokens }) => {
  const combinedPrompt = system ? `${system}\n\n${user}` : user;

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
    if (model === 'claude-sonnet-4-6-20251022' && hasAnthropicKey) {
      console.log(`[LLMRouter] Using Anthropic: ${model}`);
      const res = await generateWithClaude({ system, user, model, maxTokens });
      console.log(`[LLM] Provider: Anthropic | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: true`);
      return res;
    }
    if ((model === 'gpt-4o' || model === 'gpt-4o-mini') && hasOpenAIKey) {
      console.log(`[LLMRouter] Using OpenAI: ${model}`);
      const res = await generateWithOpenAI({ system, user, model: model || 'gpt-4o', maxTokens });
      console.log(`[LLM] Provider: OpenAI | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: true`);
      return res;
    }
  } catch (error) {
    console.log(`[LLM] Provider: ${primaryProvider} | Model: ${model} | Duration: ${Date.now() - primaryStartTime}ms | Success: false`);
    console.error(`❌ [LLMRouter] Primary model ${model} failed! Falling back to Gemini. Error: ${error.message}`);
    // Flow continues down to Gemini fallback
  }

  // Fallback / Default: Gemini 2.5 Flash
  const fallbackModel = 'gemini-2.5-flash';
  const fallbackStartTime = Date.now();
  try {
    console.log(`[LLMRouter] Using Gemini: ${fallbackModel} (fallback or primary)`);
    const res = await generateWithGemini({ user: combinedPrompt, maxTokens });
    console.log(`[LLM] Provider: Google | Model: ${fallbackModel} | Duration: ${Date.now() - fallbackStartTime}ms | Success: true`);
    return res;
  } catch (err) {
    console.log(`[LLM] Provider: Google | Model: ${fallbackModel} | Duration: ${Date.now() - fallbackStartTime}ms | Success: false`);
    throw err;
  }
};

const processRequest = async ({ brief, additionalContext, toneOverride, userPlan, clientId, userId }) => {
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
  const systemPrompt = await getBrandContext(clientId, userId, userPlan);
  const model = getModelForTask(taskType);

  // 3. Determine maxTokens based on plan and task
  const planKey = ['agency', 'enterprise'].includes(userPlan) ? 'premium' : 'standard';
  
  let maxTokens;
  switch (taskType) {
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

  // Assemble the final user prompt
  let finalUserPrompt = brief.briefText;
  if (toneOverride && toneOverride !== 'Brand default') {
    finalUserPrompt += `\n\nTONE REQUIREMENT: ${toneOverride}`;
  }
  if (additionalContext) {
    finalUserPrompt += `\n\nADDITIONAL CONTEXT / INSTRUCTIONS:\n${additionalContext}`;
  }

  const generatedText = await generateText({
    model,
    system: systemPrompt,
    user: finalUserPrompt,
    maxTokens
  });

  const wordCount = generatedText.trim().split(/\s+/).length;
  const apiCost = calculateCost(model, wordCount);

  return { generatedText, modelUsed: model, taskType, wordCount, apiCost };
};

module.exports = { processRequest };


