const router = require('express').Router();
const DOMPurify = require('isomorphic-dompurify');
const { generateWithOpenAI } = require('../services/openai.service');
const { generateWithClaude } = require('../services/claude.service');
const { generateWithGemini } = require('../services/gemini.service');

const PROVIDERS = {
  openai: { short: 'gpt-4o-mini', long: 'gpt-4o' },
  anthropic: { short: 'claude-3-5-haiku-latest', long: 'claude-sonnet-4-6-20251022' },
  gemini: { short: 'gemini-2.0-flash', long: 'gemini-2.5-pro' }
};

const isLongForm = (contentType = '') => {
  const value = contentType.toLowerCase().replace(/[^a-z]/g, '');
  return ['blog', 'blogpost', 'seobrief', 'seoblog', 'longform', 'report'].includes(value)
    || value.includes('blog') || value.includes('seo');
};

const buildPrompt = ({ briefText, contentType, platform, length, goal, toneOverride, additionalContext, variations }) => `
Create high-quality marketing content for the following request.

Content type: ${contentType || 'marketing content'}
Platform: ${platform || 'not specified'}
Length: ${length || 'not specified'}
Goal: ${goal || 'not specified'}
Tone: ${toneOverride || 'clear, useful, and natural'}
User request: ${briefText}
Additional context: ${additionalContext || 'none'}

Return exactly ${variations} distinct variation${variations === 1 ? '' : 's'}.
${variations > 1 ? 'Separate variations with the marker === VARIATION ===.' : ''}
Do not explain your process. Return only the finished content.
`;

router.get('/health', (req, res) => res.json({ success: true, mode: 'local' }));

router.post('/generate', async (req, res, next) => {
  try {
    const {
      provider,
      apiKey,
      briefText,
      contentType,
      platform,
      length,
      goal,
      toneOverride,
      additionalContext,
      variations = 1
    } = req.body || {};

    if (!PROVIDERS[provider]) return res.status(400).json({ success: false, message: 'Unsupported provider' });
    if (!apiKey || typeof apiKey !== 'string') return res.status(400).json({ success: false, message: 'Add a provider API key first' });
    if (!briefText || briefText.trim().length < 10) return res.status(400).json({ success: false, message: 'Brief text must be at least 10 characters long' });

    const count = Math.min(Math.max(parseInt(variations, 10) || 1, 1), 5);
    const safe = (value) => DOMPurify.sanitize(String(value || '')).slice(0, 12000);
    const prompt = buildPrompt({
      briefText: safe(briefText),
      contentType: safe(contentType),
      platform: safe(platform),
      length: safe(length),
      goal: safe(goal),
      toneOverride: safe(toneOverride),
      additionalContext: safe(additionalContext),
      variations: count
    });
    const longForm = isLongForm(contentType);
    const model = longForm ? PROVIDERS[provider].long : PROVIDERS[provider].short;
    let generatedText;

    if (provider === 'openai') {
      generatedText = await generateWithOpenAI({ apiKey, model, user: prompt, maxTokens: longForm ? 8000 : 3000 });
    } else if (provider === 'anthropic') {
      generatedText = await generateWithClaude({ apiKey, model, user: prompt, maxTokens: longForm ? 8000 : 3000 });
    } else {
      const result = await generateWithGemini({ apiKey, model, user: prompt, maxTokens: longForm ? 8000 : 3000, contentType });
      generatedText = result.text;
    }

    const outputs = generatedText.split('=== VARIATION ===').map(text => text.trim()).filter(Boolean);
    res.json({
      success: true,
      output: {
        generatedText,
        outputs,
        modelUsed: model,
        contentType,
        mode: 'local'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
