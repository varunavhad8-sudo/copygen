const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '../.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log('Available Models:');
    models.models.forEach(model => {
      console.log(`${model.name} - ${model.supportedGenerationMethods}`);
    });
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
