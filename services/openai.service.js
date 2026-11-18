const OpenAI = require('openai');

const clients = new Map();

const getClient = (apiKey = process.env.OPENAI_API_KEY) => {
  if (!apiKey) throw new Error('OpenAI API key is not configured');
  if (!clients.has(apiKey)) {
    const client = new OpenAI({
      apiKey
    });
    clients.set(apiKey, client);
  }
  return clients.get(apiKey);
};

const generateWithOpenAI = async ({ system, user, model, maxTokens, apiKey }) => {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: user });
  
  const response = await getClient(apiKey).chat.completions.create({
    model: model || 'gpt-4o',
    messages,
    max_tokens: maxTokens || 1000
  });
  return response.choices[0].message.content;
};

module.exports = { generateWithOpenAI };


