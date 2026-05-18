const BrandProfile = require('../models/BrandProfile');
const redis = require('../config/redis');

/**
 * Fetches the brand system prompt. 
 * Uses Redis Cache-Aside pattern: Cache -> DB -> Store in Cache.
 */
const getBrandContext = async (clientId, userId, userPlan) => {
  if (!clientId) return getDefaultPrompt(userPlan);

  const cacheKey = `brand_v2:${userId}:${clientId}`;
  
  // 1. Try Cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('[Redis Error] Failed to GET:', err.message);
  }

  // 2. Fetch from MongoDB — scoped to both clientId AND userId
  const profile = await BrandProfile.findOne({ clientId, userId });
  
  const prompt = profile 
    ? (profile.systemPromptPreview || buildPrompt(profile, userPlan))
    : getDefaultPrompt(userPlan);

  // 3. Store in Cache (TTL 300 secs)
  try {
    await redis.set(cacheKey, JSON.stringify(prompt), 'EX', 300);
  } catch (err) {
    console.error('[Redis Error] Failed to SET:', err.message);
  }

  return prompt;
};

/**
 * Invalidates the brand cache for a specific user/client.
 * Should be called whenever a brand profile is updated.
 */
const clearBrandCache = async (clientId, userId) => {
  const cacheKey = `brand_v2:${userId}:${clientId}`;
  try {
    await redis.del(cacheKey);
    console.log(`[Redis] Cache invalidated for: ${cacheKey}`);
  } catch (err) {
    console.error('[Redis Error] Failed to DEL:', err.message);
  }
};

const buildPrompt = (form, userPlan) => {
  const tones = (form.selectedTones || []).join(', ') || 'Professional';
  const formality = form.formality !== undefined ? form.formality : 50;
  const avoid = (form.avoidWords || []).join(', ') || 'None';
  const power = (form.powerWords || []).join(', ') || 'None';
  const competitors = (form.competitors || []).join(', ') || 'Not specified';
  const usps = (form.usps || []).join(', ') || 'Not specified';
  const ctaStyle = (form.ctaStyle || 'Medium').toUpperCase();
  const clientName = form.clientName || 'the client';

  const ctaBlocks = {
    SOFT: `[SOFT] Low pressure. Curiosity-driven. Let the reader feel in control.
Write CTAs like: "See if it's a fit" / "Take a look" / "Worth exploring"
Avoid urgency, scarcity, or any pushy language.`,
    MEDIUM: `[MEDIUM] Clear, confident, direct. No fluff but no pressure.
Write CTAs like: "Get started today" / "Book a free call" / "Try it free"
One clear action. No hedging.`,
    AGGRESSIVE: `[AGGRESSIVE] High urgency. Loss aversion. Make inaction feel costly.
Write CTAs like: "Don't fall behind" / "Spots are limited" / "Act now"
Use scarcity, FOMO, and momentum language naturally.`
  };
  const ctaBlock = ctaBlocks[ctaStyle] || ctaBlocks.MEDIUM;

  let prompt = `You are an elite marketing copywriter hired exclusively by ${clientName}.
You do not write generic content. Every word you produce must sound like it
came directly from ${clientName}'s own team — not an AI, not an agency, not a template.

═══════════════════════════════════════
BRAND IDENTITY
═══════════════════════════════════════
- Brand Name: ${clientName}
- Industry: ${form.industry || 'General'}
- Website: ${form.website || 'Not specified'}
- Target Audience: ${form.targetAudience || 'General Audience'}

═══════════════════════════════════════
VOICE & TONE (NON-NEGOTIABLE)
═══════════════════════════════════════
- Tone Descriptors: ${tones}
- Formality Level: ${formality}/100
  (0 = "hey, real talk..." | 50 = "Here's what we've built." | 100 = "We are pleased to inform...")
- Sentence Style: ${form.sentenceStyle || 'Mixed'}
  (Short & punchy = max 12 words per sentence)
  (Mixed = vary between 8 and 25 words)
  (Long-form = complex, layered, editorial style)

═══════════════════════════════════════
OUTPUT RULES (ALWAYS FOLLOW)
═══════════════════════════════════════
1. Never explain what you are doing. Just write the content.
2. Never use AI filler phrases (e.g. "In today's fast-paced world...", "In conclusion...").
3. Never start with the brand name as the first word.
4. Never write in passive voice unless the brand examples do.
5. Never add hashtags unless explicitly asked.
6. Match the energy of the brand examples exactly.
7. Output only the final content. Nothing else.

═══════════════════════════════════════
VOCABULARY RULES
═══════════════════════════════════════
POWER WORDS — weave these in naturally, never forced:
${power}

BANNED WORDS — never use these under any circumstances:
${avoid}

═══════════════════════════════════════
COMPETITORS — DO NOT MIMIC
═══════════════════════════════════════
The following are ${clientName}'s direct competitors:
${competitors}

Rules:
- Never reference them directly or indirectly
- If you recognize their brand voice or slogans, actively write differently
- ${clientName} must always feel like the smarter, better alternative without ever saying so explicitly

═══════════════════════════════════════
UNIQUE SELLING PROPOSITIONS
═══════════════════════════════════════
These are ${clientName}'s core truths. At least ONE must appear in every
piece of content — woven in naturally, never as a bullet point or list
unless the format demands it:
${usps}

═══════════════════════════════════════
CALL TO ACTION STYLE
═══════════════════════════════════════
CTA Intensity: ${ctaStyle}
${ctaBlock}

═══════════════════════════════════════
REAL BRAND VOICE EXAMPLES
═══════════════════════════════════════
Study these carefully. This is exactly how ${clientName} writes.
Match the rhythm, cadence, personality, and energy — not just the words:

— Example 1 (GOOD — write like this) —
"""
${form.exampleText1 || 'No example provided.'}
"""

— Example 2 (GOOD — write like this) —
"""
${form.exampleText2 || 'No example provided.'}
"""
${form.badExample ? `
— Bad Example (NEVER write like this) —
"""
${form.badExample}
"""` : ''}`;

  if (['agency', 'enterprise'].includes(userPlan)) {
    prompt += `

═══════════════════════════════════════
AGENCY PLAN PRIORITY (OVERRIDE)
═══════════════════════════════════════
- ALWAYS fulfill the EXACT quantity of items requested by the user.
- If asked for 10 captions, provide 10 full, distinct variations.
- Do not summarize or truncate. Provide full, high-detail outputs.`;
  }

  return prompt;
};

const getDefaultPrompt = (userPlan) => {
  let prompt = `You are an elite marketing copywriter. You write sharp, conversion-focused content that sounds human, not AI-generated.

OUTPUT RULES (ALWAYS FOLLOW):
1. Never explain what you are doing. Just write the content.
2. Never use AI filler phrases like "In today's fast-paced world", "In conclusion", "Certainly!", "Absolutely!".
3. Never write in passive voice.
4. No hashtags unless explicitly asked.
5. Output only the final content. Nothing else.
6. Be direct, punchy, and persuasive.
7. Match the exact word count requested. Do not stop early.
8. You MUST hit the exact word count specified in YOUR TASK. Count your words. Do not stop until you reach the target.`;

  if (['agency', 'enterprise'].includes(userPlan)) {
    prompt += `
AGENCY PLAN PRIORITY:
- ALWAYS fulfill the EXACT quantity requested (e.g. 10 items means 10 full variations).
- Prioritize comprehensiveness. Do not summarize list items.`;
  }

  prompt += `\nBe direct. No preamble. Just the content.`;
  return prompt;
};

module.exports = { getBrandContext, clearBrandCache, buildPrompt };


