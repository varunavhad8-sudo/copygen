const Anthropic = require('@anthropic-ai/sdk');

let client;

const getClient = () => {
  if (!client) {
    client = new Anthropic({ 
      apiKey: process.env.ANTHROPIC_API_KEY 
    });
  }
  return client;
};

const generateWithClaude = async ({ system, user, model, maxTokens }) => {
  const response = await getClient().messages.create({
    model: model || 'claude-sonnet-4-6-20251022',
    max_tokens: maxTokens || 1000,
    system: system || '',
    messages: [{ role: 'user', content: user }]
  });
  return response.content[0].text;
};

module.exports = { generateWithClaude };


