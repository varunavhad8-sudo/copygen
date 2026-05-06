const { GoogleGenerativeAI } = require("@google/generative-ai");


// Initialize the SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


/**
 * Flexible generation function for Gemini using the official SDK.
 * Supports positional arguments (prompt, system, model) or an object { user, system, model }.
 */
const generateWithGemini = async (arg1, arg2 = '', arg3 = 'gemini-2.5-flash') => {
  let prompt, systemPrompt, modelName;

  if (typeof arg1 === 'object' && arg1 !== null) {
    // Handle object argument: { user, prompt, system, model }
    prompt = arg1.user || arg1.prompt || '';
    systemPrompt = arg1.system || '';
    modelName = arg1.model || arg3;
  } else {
    // Handle positional arguments
    prompt = arg1;
    systemPrompt = arg2;
    modelName = arg3;
  }

  if (!prompt) {
    throw new Error('[GeminiService] No prompt provided');
  }

  // Handle legacy/retired models by mapping to 2.5
  let targetModel = modelName;
  if (targetModel.includes('pro') && !targetModel.includes('2.5')) targetModel = 'gemini-2.5-pro';
  if (targetModel.includes('flash') && !targetModel.includes('2.5')) targetModel = 'gemini-2.5-flash';
  if (targetModel === 'gemini-pro') targetModel = 'gemini-2.5-pro';
  
  // Try models in order of preference
  const modelsToTry = [targetModel, 'gemini-2.5-flash', 'gemini-2.5-pro'];
  let lastError = null;

  for (const modelId of modelsToTry) {
    try {
      console.log(`[GeminiService] Attempting generation with model: ${modelId}`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelId,
        systemInstruction: systemPrompt || undefined
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        return text;
      }
      
      throw new Error(`Empty response from model: ${modelId}`);
    } catch (error) {
      lastError = error;
      console.warn(`[GeminiService] Model ${modelId} failed: ${error.message}`);
      // Continue to next model if available
    }
  }

  console.error('[GeminiService] All model attempts failed.');
  throw lastError || new Error('Failed to generate content with Gemini');
};

/**
 * Legacy/Helper for routing.
 */
const classifyWithGemini = async (prompt) => {
  const res = await generateWithGemini(prompt, 'Classify the following request into one of these categories: LONG_FORM, BACKGROUND, SHORT_FORM. Return ONLY the category name.');
  const text = res.trim().toUpperCase();
  if (text.includes('LONG_FORM')) return 'LONG_FORM';
  if (text.includes('BACKGROUND')) return 'BACKGROUND';
  return 'SHORT_FORM';
};

/**
 * Long-form generation with specific prompting for detailed output.
 */
const generateLongForm = async (prompt, systemPrompt, modelName = 'gemini-2.5-pro') => {
  return await generateWithGemini(prompt, systemPrompt, modelName);
};

module.exports = { generateWithGemini, classifyWithGemini, generateLongForm };
