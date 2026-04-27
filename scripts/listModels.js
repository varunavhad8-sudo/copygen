require('dotenv').config({ path: '../.env' });

(async () => {
  const key = process.env.GEMINI_API_KEY;
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  );
  const d = await r.json();
  if (d.error) {
    console.error('API Error:', d.error.message);
    return;
  }
  console.log('\nAvailable Gemini models:\n');
  d.models
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .forEach(m => console.log(' ✓', m.name));
})();


