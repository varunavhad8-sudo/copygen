const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const classifyWithGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: 10 }
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().toUpperCase();
  if (text.includes('LONG_FORM')) return 'LONG_FORM';
  if (text.includes('BACKGROUND')) return 'BACKGROUND';
  return 'SHORT_FORM';
};

const generateWithGemini = async ({ user, maxTokens }) => {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { maxOutputTokens: maxTokens || 1000 }
  });
  const result = await model.generateContent(user);
  return result.response.text();
};

module.exports = { classifyWithGemini, generateWithGemini };


