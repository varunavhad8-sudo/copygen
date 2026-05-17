const Output = require('../models/Output');
const { checkFacts } = require('../services/factChecker.service');

/**
 * Handles the fact-checking request.
 * 1. Validates content.
 * 2. Calls the fact checker service.
 * 3. Updates existing output if outputId is provided.
 */
const check = async (req, res, next) => {
  try {
    const { content, outputId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required for fact checking.' 
      });
    }

    // Call the fact checker service
    const result = await checkFacts(content);

    // If outputId is provided, update the Output document
    if (outputId) {
      await Output.findOneAndUpdate(
        { _id: outputId, userId: req.user._id },
        { factCheckResult: result },
        { new: true }
      ).catch(err => console.error('[FactCheckController] Non-critical output update failed:', err));
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { check };
