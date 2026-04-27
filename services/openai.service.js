const OpenAI = require('openai');

let client;

const getClient = () => {
  if (!client) {
    client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }
  return client;
};

const generateWithOpenAI = async ({ system, user, model, maxTokens }) => {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  
  const response = await getClient().chat.completions.create({
    model: model || 'gpt-4o',
    messages,
    max_tokens: maxTokens || 1000
  });
  return response.choices[0].message.content;
};

module.exports = { generateWithOpenAI };


