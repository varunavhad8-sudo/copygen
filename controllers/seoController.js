const Output = require('../models/Output');
const BrandProfile = require('../models/BrandProfile');
const Client = require('../models/Client');
const { generateSEOBlog } = require('../services/seo.service');
const { incrementUsage } = require('../services/usage.service');
const DOMPurify = require('isomorphic-dompurify');

const generate = async (req, res, next) => {
  try {
    console.log('SEO Generate hit:', req.body);
    const { topic, clientId, targetKeyword, wordCount } = req.body;

    const safeTopic = DOMPurify.sanitize(topic || '');
    const safeTargetKeyword = DOMPurify.sanitize(targetKeyword || '');
    const safeWordCount = parseInt(wordCount, 10) || 1000;

    if (!safeTopic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    let brandMemory = {};
    if (clientId) {
      // 4. Fetch BrandProfile from MongoDB using clientId
      const profile = await BrandProfile.findOne({ clientId, userId: req.user._id });
      if (profile) {
        brandMemory = {
          tone: profile.selectedTones ? profile.selectedTones.join(', ') : '',
          formality: profile.formality,
          avoidWords: profile.avoidWords,
          powerWords: profile.powerWords,
          audience: profile.targetAudience,
          ctaStyle: profile.ctaStyle,
          usps: profile.usps,
          competitors: profile.competitors
        };
      }
    }

    // 5. Call generateSEOBlog from server/services/seo.service.js
    console.log('Calling generateSEOBlog with:', { topic, clientId, targetKeyword, wordCount });
    const result = await generateSEOBlog({
      topic: safeTopic,
      clientId,
      brandMemory,
      targetKeyword: safeTargetKeyword,
      wordCount: safeWordCount
    });
    console.log('SEO result received:', JSON.stringify(result).substring(0, 200));

    // 6. Save result to MongoDB using the existing Output model
    const output = await Output.create({
      userId: req.user._id,
      clientId: clientId || undefined,
      contentType: 'seoblog',
      generatedText: JSON.stringify(result.data),
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

    // 7. Return full output as JSON
    res.status(200).json({ 
      success: true, 
      output: {
        ...result.data,
        _id: output._id
      }
    });

  } catch (error) {
    console.error('SEO Controller Error:', error.message);
    console.error('Full error:', error);
    next(error);
  }
};

module.exports = { generate };
