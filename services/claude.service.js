const Anthropic = require('@anthropic-ai/sdk');

const clients = new Map();

const getClient = (apiKey = process.env.ANTHROPIC_API_KEY) => {
  if (!apiKey) throw new Error('Anthropic API key is not configured');
  if (!clients.has(apiKey)) {
    clients.set(apiKey, new Anthropic({ apiKey }));
  }
  return clients.get(apiKey);
};

const generateWithClaude = async ({ system, user, model, maxTokens, apiKey }) => {
  const response = await getClient(apiKey).messages.create({
    model: model || 'claude-sonnet-4-6-20251022',
    max_tokens: maxTokens || 1000,
    system: system || '',
    messages: [{ role: 'user', content: user }]
  });
  return response.content[0].text;
};

module.exports = { generateWithClaude };


