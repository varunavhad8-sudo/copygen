const generateWithGemini = async (prompt, systemPrompt = '') => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = 'gemini-2.5-flash';
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [{
      parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    console.error('Gemini full response:', JSON.stringify(data));
    throw new Error('Invalid response from Gemini API');
  }
  return data.candidates[0].content.parts[0].text;
};

// Added helper to maintain compatibility with existing router calls
const classifyWithGemini = async (prompt) => {
  const res = await generateWithGemini(prompt);
  const text = res.trim().toUpperCase();
  if (text.includes('LONG_FORM')) return 'LONG_FORM';
  if (text.includes('BACKGROUND')) return 'BACKGROUND';
  return 'SHORT_FORM';
};

const generateLongForm = async (prompt, systemPrompt) => {
  return await generateWithGemini(prompt, systemPrompt);
};

module.exports = { generateWithGemini, classifyWithGemini, generateLongForm };
