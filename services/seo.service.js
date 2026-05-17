const { processRequest } = require('./llmRouter');

/**
 * Generates an SEO optimized blog post along with meta data, FAQs, and social captions.
 *
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} params.clientId
 * @param {Object} params.brandMemory
 * @param {string} params.targetKeyword
 * @param {number} params.wordCount
 * @returns {Promise<Object>} The structured JSON output
 */
const generateSEOBlog = async ({ topic, clientId, brandMemory, targetKeyword, wordCount, userPlan }) => {
  try {
    const tone = brandMemory?.tone || 'Professional';
    const voice = brandMemory?.voice || 'Authoritative';
    const avoidWords = brandMemory?.['avoid-words'] || brandMemory?.avoidWords || 'None';
    const powerWords = brandMemory?.['power words'] || brandMemory?.powerWords || 'None';
    const audience = brandMemory?.audience || 'General';
    const ctaStyle = brandMemory?.['CTA style'] || brandMemory?.ctaStyle || 'Medium';

    const brandMemoryContext = `
INSTRUCTIONS FOR BRAND MEMORY INJECTION:
You MUST apply the following brand memory rules to EVERY section of your output (Blog, Meta Tags, Social Captions, FAQs, etc.):
- Tone: ${tone}
- Voice: ${voice}
- Avoid Words: ${Array.isArray(avoidWords) ? avoidWords.join(', ') : avoidWords}
- Power Words: ${Array.isArray(powerWords) ? powerWords.join(', ') : powerWords}
- Target Audience: ${audience}
- CTA Style: ${ctaStyle}

${(tone || voice) ? `CRITICAL: The brand's tone (${tone}) and voice (${voice}) are the soul of this content. Emphasize and apply them STRONGLY throughout every single paragraph. No generic corporate filler.` : ''}
    `.trim();

    const writingStyleInstructions = `
WRITING STYLE REQUIREMENTS:
- TONE: Relatable, conversational, and scannable. Write for Indian college students—avoid complex jargon.
- STRUCTURE: Use short paragraphs (max 3-4 lines).
- SEO: Include the primary keyword ("${targetKeyword}") in the first 100 words.
- HEADINGS: Include one H1 with the primary keyword. Use H2 subheadings every 150-200 words to maintain scannability.
- BRANDING: Mention the brand name naturally 2-3 times throughout the article.
- PERSPECTIVE: Write in first person ("I" or "we") where appropriate to build connection.
- NEVER use AI filler: "In today's digital age", "In conclusion", "It's important to note", "Leverage", "Delve".
- ACTIONABLE: Add specific steps the reader can take immediately.
    `.trim();

    const jsonSchema = `
You must return your entire response as a single, valid JSON object. Do not include any markdown formatting like \`\`\`json outside the JSON object. The JSON must exactly match the following structure:
{
  "article": "Full blog article content using HTML tags (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>). DO NOT use markdown symbols like #.",
  "metaTitle": "Meta title (must be under 60 characters)",
  "metaDescription": "Meta description (must be under 160 characters)",
  "urlSlug": "lowercase-hyphenated-slug",
  "faq": [
    { "question": "Question 1", "answer": "Answer 1" },
    { "question": "Question 2", "answer": "Answer 2" },
    { "question": "Question 3", "answer": "Answer 3" },
    { "question": "Question 4", "answer": "Answer 4" },
    { "question": "Question 5", "answer": "Answer 5" }
  ],
  "jsonLd": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "...",
    "description": "..."
  },
  "imageSuggestions": [
    { "concept": "Description of image 1", "altText": "SEO optimized alt text 1" },
    { "concept": "Description of image 2", "altText": "SEO optimized alt text 2" },
    { "concept": "Description of image 3", "altText": "SEO optimized alt text 3" }
  ],
  "internalLinks": [
    "[LINK: anchor text 1 | suggested page topic 1]",
    "[LINK: anchor text 2 | suggested page topic 2]",
    "[LINK: anchor text 3 | suggested page topic 3]"
  ],
  "externalLinks": [
    "Authoritative source 1 description/URL",
    "Authoritative source 2 description/URL",
    "Authoritative source 3 description/URL"
  ],
  "socialCaptions": {
    "linkedin": "Caption for LinkedIn",
    "x": "Caption for X (formerly Twitter)",
    "facebook": "Caption for Facebook"
  }
}
    `.trim();

    const briefText = `
Write a comprehensive, SEO-optimized blog post about: "${topic}".
Target Keyword: "${targetKeyword}"
Approximate Word Count: ${wordCount || 1000} words.

${brandMemoryContext}

${writingStyleInstructions}

Ensure you generate all requested elements:
- Article (HTML format)
- Meta Title & Description
- URL Slug
- 5 FAQs minimum
- JSON-LD
- 3 Image Suggestions
- 3 Internal Links
- 3 External Links
- Social Captions (LinkedIn, X, Facebook)
    `.trim();

    const additionalContext = `
CRITICAL REQUIREMENT: Return ONLY raw, valid JSON. Do not include introductory text, conversational filler, or markdown block ticks (like \`\`\`json).
${jsonSchema}
    `.trim();

    const response = await processRequest({
      brief: {
        briefText,
        contentType: 'seoblog',
        platform: 'Website/Blog',
        length: wordCount ? `${wordCount} words` : 'Long form',
        goal: 'SEO ranking and reader engagement'
      },
      additionalContext,
      clientId,
      userPlan: userPlan || 'free',
      responseMimeType: 'application/json'
    });

    console.log('Raw Gemini response (first 500 chars):', response.generatedText.substring(0, 500));

    let parsedResult;
    try {
      let cleaned = response.generatedText.trim();
      
      // 1. Handle common markdown wrapping
      if (cleaned.includes('```')) {
        const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) cleaned = codeBlockMatch[1].trim();
      }
      
      // 2. Locate the first { and last } to isolate the JSON object
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      // 3. Attempt to parse
      parsedResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[SEO Service] JSON Parse Failed.');
      console.error('Error:', parseError.message);
      
      // Log truncation hint
      if (response.generatedText.length > 5000) {
        console.warn(`[SEO Service] Large response detected (${response.generatedText.length} chars). Truncation is likely.`);
      }
      
      // Create a more informative error for the UI
      const errorMessage = response.generatedText.length < 100 
        ? 'AI returned an empty or too short response. Please try again.'
        : 'AI response was too long or formatted incorrectly. Try reducing the word count.';
        
      throw new Error(errorMessage);
    }

    return {
      data: parsedResult,
      modelUsed: response.modelUsed,
      taskType: response.taskType,
      generatedWordCount: response.generatedWordCount,
      apiCost: response.apiCost
    };

  } catch (error) {
    console.error('[SEO Service] Error generating SEO blog:', error.message);
    throw error;
  }
};

module.exports = { generateSEOBlog };
