const { GoogleGenerativeAI } = require("@google/generative-ai");


// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


/**
 * Flexible generation function for Gemini using the official SDK.
 * Supports positional arguments (prompt, system, model) or an object { user, system, model }.
 */
const generateWithGemini = async (arg1, arg2 = '', arg3 = 'gemini-3.1-pro-preview', maxTokens = null) => {
  let prompt, systemPrompt, modelName, responseMimeType;

  if (typeof arg1 === 'object' && arg1 !== null) {
    prompt = arg1.user || arg1.prompt || '';
    systemPrompt = arg1.system || '';
    modelName = arg1.model || arg3;
    if (arg1.maxTokens) maxTokens = arg1.maxTokens;
    if (arg1.responseMimeType) responseMimeType = arg1.responseMimeType;
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
  
  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      console.log(`[GeminiService] Attempting generation with model: ${modelId}`);
      
      const config = {
        model: modelId,
        systemInstruction: systemPrompt || undefined
      };

      if (maxTokens || responseMimeType) {
        config.generationConfig = { 
          maxOutputTokens: maxTokens,
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
