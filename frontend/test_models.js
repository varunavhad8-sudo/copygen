const { generateWithGemini } = require('./server/services/gemini.service');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  console.log('Testing gemini-2.5-flash...');
  try {
    const res = await generateWithGemini('Hello, say hi!', 'gemini-2.5-flash');
    console.log('Success:', res.modelUsed);
  } catch (err) {
    console.error('Failed:', err.message);
  }

  console.log('\nTesting gemini-1.5-flash (should map to 2.5)...');
  try {
    const res = await generateWithGemini('Hello, say hi!', 'gemini-1.5-flash');
    console.log('Success:', res.modelUsed);
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

test();
