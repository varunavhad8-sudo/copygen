const axios = require('axios');
const { generateWithGemini } = require('./gemini.service');

/**
 * Performs an end-to-end fact check on the provided content.
 * 
 * Step 1: Extract factual claims using LLM.
 * Step 2: Verify claims using Brave Search API.
 * Step 3: Score confidence and suggest replacements using LLM.
 * 
 * @param {string} content - The text to fact check.
 * @returns {Promise<Object>} The fact check result with claims and summary.
 */
const checkFacts = async (content) => {
  try {
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required for fact checking.');
    }

    // ── STEP 1: CLAIM EXTRACTION ───────────────────────────────────────────
    const extractionPrompt = `
      You are a factual claim extractor. Your task is to identify every factual claim in the provided content.
      A claim is: any statistic, percentage, named study, quote, date, or attribution to a person or organization.
      
      Return ONLY a raw JSON array of objects. Do not include markdown code blocks or introductory text.
      Each object must have the following structure:
      {
        "id": number,
        "claim": "The specific claim text",
        "paragraph": "A snippet of the paragraph where the claim appears"
      }
    `.trim();

    const extractionRes = await generateWithGemini(`${extractionPrompt}\n\nContent: ${content}`);
    
    // Convert string response to matching structure for extractionRes
    const extractionGeneratedText = extractionRes;

    let extractedClaims = [];
    try {
      let cleanJson = extractionGeneratedText.trim();
      // Remove potential markdown blocks
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
      else if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      
      extractedClaims = JSON.parse(cleanJson.trim());
    } catch (e) {
      console.error('[FactChecker] Failed to parse extracted claims:', extractionGeneratedText);
      // If extraction fails, we return an empty set rather than crashing
      return {
        claims: [],
        summary: { total: 0, verified: 0, uncertain: 0, unverified: 0 }
      };
    }

    if (!Array.isArray(extractedClaims) || extractedClaims.length === 0) {
      return {
        claims: [],
        summary: { total: 0, verified: 0, uncertain: 0, unverified: 0 }
      };
    }

    // ── STEP 2 & 3: VERIFICATION & SCORING ──────────────────────────────────
    const results = await Promise.all(extractedClaims.map(async (claimObj) => {
      let searchData = null;
      
      // Step 2: Web Verification
      try {
        if (!process.env.SERPER_API_KEY) {
          throw new Error('Serper API key missing');
        }

        const serperRes = await axios.post('https://google.serper.dev/search', 
          { q: claimObj.claim },
          {
            headers: { 
              'X-API-KEY': process.env.SERPER_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 5000 // 5s timeout per claim
          }
        );

        // Parse top 3 results per claim
        searchData = (serperRes.data.organic || [])
          .slice(0, 3)
          .map(r => ({ title: r.title, description: r.snippet || r.description, url: r.link || r.url }));

      } catch (err) {
        console.warn(`[FactChecker] Search failed for claim "${claimObj.claim}":`, err.message);
        // Mark as uncertain and continue as per requirements
        return {
          ...claimObj,
          status: 'uncertain',
          source: null,
          replacement: null
        };
      }

      // Step 3: Confidence Scoring
      try {
        const scoringPrompt = `
          You are a fact-checking assistant. Given a claim and search results from the web, determine its validity.
          
          CLAIM: "${claimObj.claim}"
          SEARCH RESULTS: ${JSON.stringify(searchData)}
          
          Assign one of these statuses:
          - "verified": If search results clearly confirm the claim with reliable sources.
          - "uncertain": If results are ambiguous, conflicting, or insufficient.
          - "unverified": If results contradict the claim or if it is factually incorrect.
          
          If "unverified", generate one "replacement" suggestion that is factually correct based on the search results, and include the "source" URL.
          
          Return ONLY a raw JSON object. Do not include markdown code blocks.
          Structure:
          {
            "status": "verified" | "uncertain" | "unverified",
            "source": "URL or null",
            "replacement": "Corrected claim or null"
          }
        `.trim();

        const scoringResult = await generateWithGemini(scoringPrompt);
        
        const scoringGeneratedText = scoringResult;

        let scoredData;
        try {
          let cleanScoreJson = scoringGeneratedText.trim();
          if (cleanScoreJson.startsWith('```json')) cleanScoreJson = cleanScoreJson.substring(7);
          else if (cleanScoreJson.startsWith('```')) cleanScoreJson = cleanScoreJson.substring(3);
          if (cleanScoreJson.endsWith('```')) cleanScoreJson = cleanScoreJson.substring(0, cleanScoreJson.length - 3);
          
          scoredData = JSON.parse(cleanScoreJson.trim());
        } catch (e) {
          console.error('[FactChecker] Failed to parse scoring JSON:', scoringGeneratedText);
          return { ...claimObj, status: 'uncertain', source: null, replacement: null };
        }

        return {
          ...claimObj,
          status: scoredData.status || 'uncertain',
          source: scoredData.source || (searchData[0]?.url || null),
          replacement: scoredData.replacement || null
        };

      } catch (err) {
        console.error(`[FactChecker] Scoring failed for claim "${claimObj.claim}":`, err.message);
        return { ...claimObj, status: 'uncertain', source: null, replacement: null };
      }
    }));

    // ── SUMMARY GENERATION ────────────────────────────────────────────────
    const summary = results.reduce((acc, curr) => {
      acc.total++;
      if (curr.status === 'verified') acc.verified++;
      else if (curr.status === 'uncertain') acc.uncertain++;
      else if (curr.status === 'unverified') acc.unverified++;
      return acc;
    }, { total: 0, verified: 0, uncertain: 0, unverified: 0 });

    return {
      claims: results,
      summary
    };

  } catch (error) {
    console.error('[FactChecker Service] Fatal error:', error.message);
    throw error;
  }
};

module.exports = { checkFacts };
