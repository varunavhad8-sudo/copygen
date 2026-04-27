require('dotenv').config({ path: '../.env' });
const { generateWithOpenAI } = require('../services/openai.service');
const { generateWithClaude } = require('../services/claude.service');
const { generateWithGemini } = require('../services/gemini.service');

async function testOpenAI() {
  console.log('\n--- Testing OpenAI ---');
  try {
    const res = await generateWithOpenAI({
      user: 'Hello, are you working? Reply with "Yes, OpenAI is active."',
      model: 'gpt-4o-mini'
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('OpenAI Error:', err.message);
  }
}

async function testAnthropic() {
  console.log('\n--- Testing Anthropic ---');
  try {
    const res = await generateWithClaude({
      user: 'Hello, are you working? Reply with "Yes, Anthropic is active."',
      model: 'claude-3-5-sonnet-20240620'
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Anthropic Error:', err.message);
  }
}

async function testGemini() {
  console.log('\n--- Testing Gemini ---');
  try {
    const res = await generateWithGemini({
      user: 'Hello, are you working? Reply with "Yes, Gemini is active."',
    });
    console.log('Result:', res);
  } catch (err) {
    console.error('Gemini Error:', err.message);
  }
}

(async () => {
  console.log('Starting AI Connection Tests...');
  
  if (process.env.OPENAI_API_KEY) await testOpenAI();
  else console.log('\nOpenAI Key missing in .env');

  if (process.env.ANTHROPIC_API_KEY) await testAnthropic();
  else console.log('\nAnthropic Key missing in .env');

  if (process.env.GEMINI_API_KEY) await testGemini();
  else console.log('\nGemini Key missing in .env');

  console.log('\nTests completed.');
})();
