
/**
 * Verification script for AI context integration.
 * This tests the processRequest logic by mocking ALL AI services.
 */
const { processRequest } = require('../services/llmRouter');
const mongoose = require('mongoose');

// Mock dependencies
const geminiService = require('../services/gemini.service');
const originalGenerate = geminiService.generateWithGemini;
const originalClassify = geminiService.classifyWithGemini;

async function verifyContext() {
  console.log('Testing prompt integration with Full Mock...');

  let capturedPrompt = '';
  
  // 1. Mock Classification (Return fixed task type)
  geminiService.classifyWithGemini = async () => {
    return 'SHORT_FORM';
  };

  // 2. Mock Gemini generation
  geminiService.generateWithGemini = async ({ user }) => {
    capturedPrompt = user;
    return 'Mock Response';
  };

  // Mock inputs
  const mockData = {
    brief: { briefText: 'Write a tweet about coffee.', contentType: 'Caption' },
    additionalContext: 'Mention gravity and Einstein.',
    toneOverride: 'More formal',
    clientId: null,
    userId: new mongoose.Types.ObjectId()
  };

  try {
    const result = await processRequest(mockData);
    
    console.log('--- CAPTURED PROMPT ---');
    console.log(capturedPrompt);
    
    const hasBrief = capturedPrompt.includes('Write a tweet about coffee.');
    const hasContext = capturedPrompt.includes('Mention gravity and Einstein.');
    const hasTone = capturedPrompt.includes('TONE REQUIREMENT: More formal');

    if (hasBrief && hasContext && hasTone) {
      console.log('✅ SUCCESS: All fields (Brief, Context, Tone) integrated correctly.');
      console.log('Result word count:', result.wordCount);
    } else {
      console.log('❌ FAILURE: Missing data in combined prompt.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  } finally {
    // Restore
    geminiService.generateWithGemini = originalGenerate;
    geminiService.classifyWithGemini = originalClassify;
    process.exit(0);
  }
}

verifyContext();
