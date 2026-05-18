const { GoogleGenerativeAI } = require("@google/generative-ai");


// Safe load & clean key
let apiKey = (process.env.GEMINI_API_KEY || '').trim();
// Remove outer quotes if present
if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
  apiKey = apiKey.slice(1, -1).trim();
}

console.log('[GeminiService] Initializing with key status:', {
  hasKey: !!apiKey,
  keyLength: apiKey.length,
  keyPreview: apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : 'none'
});

const genAI = new GoogleGenerativeAI(apiKey);


/**
 * Flexible generation function for Gemini using the official SDK.
 * Supports positional arguments (prompt, system, model) or an object { user, system, model }.
 */
const generateWithGemini = async (arg1, arg2 = '', arg3 = 'gemini-3.1-pro-preview', maxTokens = null) => {
  let prompt, systemPrompt, modelName, responseMimeType, contentType;

  if (typeof arg1 === 'object' && arg1 !== null) {
    prompt = arg1.user || arg1.prompt || '';
    systemPrompt = arg1.system || '';
    modelName = arg1.model || arg3;
    if (arg1.maxTokens) maxTokens = arg1.maxTokens;
    if (arg1.responseMimeType) responseMimeType = arg1.responseMimeType;
    if (arg1.contentType) contentType = arg1.contentType;
  } else {
    prompt = arg1;
    systemPrompt = arg2;
    modelName = arg3;
  }

  if (!prompt) {
    throw new Error('[GeminiService] No prompt provided');
  }

  let targetModel = modelName;
  if (targetModel === 'gemini-pro') targetModel = 'gemini-1.5-pro';
  if (targetModel === 'gemini-flash') targetModel = 'gemini-1.5-flash';
  
  const modelsToTry = [
    targetModel,           // gemini-3.1-pro-preview (primary)
    'gemini-2.5-pro',      // fallback 1
    'gemini-2.5-flash',    // fallback 2
    'gemini-2.0-flash'     // last resort
  ];
  
  // Resolve maxOutputTokens using content type token limits map
  let resolvedMaxTokens = maxTokens;
  if (contentType) {
    const tokenLimitMap = {
      'Google Ads': 500,
      'Social Media': 800,
      'Email': 1500,
      'Blog Post': 6000,
      'SEO Brief': 2500,
      'Landing Page': 3000,
      'default': 2000
    };

    const original = String(contentType).trim();
    const ct = original.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (original === 'Google Ads' || ct === 'googlead' || ct === 'facebookad' || ct === 'ad' || ct === 'adcopy' || ct === 'ads' || ct === 'googleads' || ct === 'facebookads' || ct === 'facebookadcopy') {
      resolvedMaxTokens = tokenLimitMap['Google Ads'];
    } else if (original === 'Social Media' || ct === 'socialpost' || ct.includes('social') || ct.includes('caption') || ct.includes('instagram') || ct.includes('youtube') || ct.includes('facebook') || ct.includes('twitter') || ct.includes('linkedin')) {
      resolvedMaxTokens = tokenLimitMap['Social Media'];
    } else if (original === 'Email' || ct.includes('email')) {
      resolvedMaxTokens = tokenLimitMap['Email'];
    } else if (original === 'Blog Post' || ct === 'seoblog' || ct.includes('blog') || ct.includes('article') || ct.includes('longform')) {
      resolvedMaxTokens = tokenLimitMap['Blog Post'];
    } else if (original === 'SEO Brief' || ct === 'seo' || ct.includes('seobrief')) {
      resolvedMaxTokens = tokenLimitMap['SEO Brief'];
    } else if (original === 'Landing Page' || ct.includes('landing') || ct.includes('cta') || ct.includes('tagline') || ct.includes('headline') || ct.includes('productdesc')) {
      resolvedMaxTokens = tokenLimitMap['Landing Page'];
    } else {
      resolvedMaxTokens = tokenLimitMap['default'];
    }
    console.log(`[GeminiService] Mapped content type "${contentType}" to maxOutputTokens: ${resolvedMaxTokens}`);
  } else if (!resolvedMaxTokens) {
    resolvedMaxTokens = 2000; // default fallback if neither is provided
  }

  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      console.log(`[GeminiService] Attempting generation with model: ${modelId}`);
      
      const config = {
        model: modelId,
        systemInstruction: systemPrompt || undefined
      };

      if (resolvedMaxTokens || responseMimeType) {
        config.generationConfig = { 
          maxOutputTokens: resolvedMaxTokens,
          responseMimeType: responseMimeType
        };
      }

      const model = genAI.getGenerativeModel(config);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        return { text, modelUsed: modelId };
      }
      
      throw new Error(`Empty response from model: ${modelId}`);
    } catch (error) {
      lastError = error;
      console.warn(`[GeminiService] Model ${modelId} failed: ${error.message}`);
    }
  }

  console.error('[GeminiService] All model attempts failed.');
  throw lastError || new Error('Failed to generate content with Gemini');
};

/**
 * Legacy/Helper for routing.
 */
/**
 * Legacy/Helper for routing.
 */
const classifyWithGemini = async (prompt) => {
  // Issue 3: Use gemini-2.0-flash specifically for classification calls only
  const { text: rawText } = await generateWithGemini(prompt, 'Classify the following request into one of these categories: LONG_FORM, BACKGROUND, SHORT_FORM. Return ONLY the category name.', 'gemini-2.0-flash');
  const text = rawText.trim().toUpperCase();
  if (text.includes('LONG_FORM')) return 'LONG_FORM';
  if (text.includes('BACKGROUND')) return 'BACKGROUND';
  return 'SHORT_FORM';
};

/**
 * Long-form generation with specific prompting for detailed output.
 */
const generateLongForm = async (prompt, systemPrompt, modelName = 'gemini-3.1-pro-preview', maxTokens = null) => {
  return await generateWithGemini(prompt, systemPrompt, modelName, maxTokens);
};

module.exports = { generateWithGemini, classifyWithGemini, generateLongForm };
