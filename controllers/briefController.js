const User = require('../models/User');
const Brief = require('../models/Brief');
const Output = require('../models/Output');
const Client = require('../models/Client');
const { processRequest } = require('../services/llmRouter');
const { incrementUsage } = require('../services/usage.service');
const DOMPurify = require('isomorphic-dompurify');

const AI_TIMEOUT_MS = 120000; // 120 seconds

const withTimeout = (promise, ms) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('AI generation timed out. Please try again.')), ms)
  );
  return Promise.race([promise, timeout]);
};

const generate = async (req, res, next) => {
  try {
    const { clientId, contentType,
            brief: briefRaw,  // frontend sends 'brief'
            briefText,        // keep backwards compatible
            platform,         // new field
            length,           // new field
            goal,             // new field
            variations,       // Added
            toneOverride, additionalContext } = req.body;

    console.log('[BriefController] Request received:', { 
      clientId, 
      contentType, 
      platform: platform?.trim(), 
      length: length?.trim(), 
      goal: goal?.trim(),
      hasBrief: !!briefRaw || !!briefText
    });

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

    const virtualBrief = { 
      briefText: briefContent, 
      contentType,
      platform: safePlatform,
      length: safeLength,
      goal: safeGoal
    };

    // Generate content via LLM router
    const result = await withTimeout(
      processRequest({ 
        brief: virtualBrief, 
        additionalContext: safeAdditionalContext,
        toneOverride: safeToneOverride,
        userPlan: req.user.plan,
        clientId, 
        userId: req.user._id,
        variations: parseInt(variations) || 1
      }),
      AI_TIMEOUT_MS
    );

    const resultsArray = Array.isArray(result) ? result : [result];

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

    const outputs = await Promise.all(resultsArray.map(r => 
      Output.create({
        userId: req.user._id,
        clientId,
        briefId: brief._id,
        contentType,
        generatedText: r.generatedText,
        modelUsed: r.modelUsed,
        taskType: r.taskType,
        generatedWordCount: r.generatedWordCount,
        apiCost: r.apiCost,
        status: 'completed'
      })
    ));

    // After successful generation, increment usage
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { generationsUsed: 1 }
    });

    const updatedUser = await User.findById(req.user._id);
    const usagePercent = (updatedUser.generationsUsed / updatedUser.generationsLimit) * 100;

    if (usagePercent >= 80 && usagePercent < 81) {
      // Only fire once at 80% threshold
      const { sendGenerationLimitWarning } = require('../services/email.service');
      sendGenerationLimitWarning(updatedUser.email, updatedUser.name, {
        used: updatedUser.generationsUsed,
        limit: updatedUser.generationsLimit,
        planName: updatedUser.plan
      });
    }

    if (updatedUser.generationsUsed >= updatedUser.generationsLimit) {
      const { sendGenerationLimitExhausted } = require('../services/email.service');
      sendGenerationLimitExhausted(updatedUser.email, updatedUser.name, {
        planName: updatedUser.plan
      });
    }

    // Update client stats
    if (clientId) {
      await Client.findByIdAndUpdate(clientId, {
        $inc: { outputCount: 1 },
        lastActiveAt: new Date()
      }).catch(err => console.error('Non-critical client update failed:', err));
    }

    res.status(200).json({ success: true, output: outputs[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { generate };



