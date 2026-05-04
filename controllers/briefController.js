const Brief = require('../models/Brief');
const Output = require('../models/Output');
const Client = require('../models/Client');
const { processRequest } = require('../services/llmRouter');
const { incrementUsage } = require('../services/usage.service');
const DOMPurify = require('isomorphic-dompurify');

const generate = async (req, res, next) => {
  try {
    const { clientId, contentType,
            brief: briefRaw,  // frontend sends 'brief'
            briefText,        // keep backwards compatible
            platform,         // new field
            length,           // new field
            goal,             // new field
            toneOverride, additionalContext } = req.body;

    const briefContent = DOMPurify.sanitize(briefText || briefRaw || '');
    const safeToneOverride = DOMPurify.sanitize(toneOverride || '');
    const safeAdditionalContext = DOMPurify.sanitize(additionalContext || '');
    const safePlatform = DOMPurify.sanitize(platform || '');
    const safeLength = DOMPurify.sanitize(length || '');
    const safeGoal = DOMPurify.sanitize(goal || '');

    if (!briefContent) {
      return res.status(400).json({ 
        message: 'Brief text is required' 
      });
    }

    // Generate content via LLM router with a 90-second timeout
    const virtualBrief = { 
      briefText: briefContent, 
      contentType,
      platform: safePlatform,
      length: safeLength,
      goal: safeGoal
    };
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error('Generation timed out. The AI provider is taking too long to respond.');
        err.status = 504; // Gateway Timeout
        reject(err);
      }, 90000); // 90 seconds
    });

    const processPromise = processRequest({ 
      brief: virtualBrief, 
      additionalContext: safeAdditionalContext,
      toneOverride: safeToneOverride,
      userPlan: req.user.plan,
      clientId, 
      userId: req.user._id 
    });

    // Race the generation against the timeout
    const result = await Promise.race([processPromise, timeoutPromise]);

    // Success! Now create the records
    const brief = await Brief.create({
      userId: req.user._id,
      clientId,
      contentType,
      briefText: briefContent,
      toneOverride: safeToneOverride,
      additionalContext: safeAdditionalContext,
      status: 'completed'
    });

    const output = await Output.create({
      userId: req.user._id,
      clientId,
      briefId: brief._id,
      contentType,
      generatedText: result.generatedText,
      modelUsed: result.modelUsed,
      taskType: result.taskType,
      wordCount: result.wordCount,
      apiCost: result.apiCost,
      status: 'completed'
    });

    // Increment usage
    await incrementUsage(req.user._id);

    // Update client stats
    if (clientId) {
      await Client.findByIdAndUpdate(clientId, {
        $inc: { outputCount: 1 },
        lastActiveAt: new Date()
      }).catch(err => console.error('Non-critical client update failed:', err));
    }

    res.status(200).json({ success: true, output });
  } catch (error) {
    next(error);
  }
};

module.exports = { generate };



