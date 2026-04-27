const Output = require('../models/Output');

const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const outputs = await Output.find({ 
      userId, createdAt: { $gte: startOfMonth } 
    });

    const totalOutputs = outputs.length;
    const totalWordCount = outputs.reduce(
      (sum, o) => sum + (o.wordCount || 0), 0);
    const totalApiCost = outputs.reduce(
      (sum, o) => sum + (o.apiCost || 0), 0);
    const estimatedHoursSaved = 
      Math.round(totalWordCount / 250);
    const activeClients = new Set(
      outputs.map(o => o.clientId?.toString())
    ).size;

    // Additional metrics for frontend
    const typeCounts = {};
    const modelCounts = {};
    outputs.forEach(o => {
      if (o.contentType) typeCounts[o.contentType] = (typeCounts[o.contentType] || 0) + 1;
      if (o.modelUsed) modelCounts[o.modelUsed] = (modelCounts[o.modelUsed] || 0) + 1;
    });

    const mostUsedType = Object.entries(typeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None';
    const mostUsedModel = Object.entries(modelCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None';

    res.json({ success: true, summary: {
      totalOutputs, totalWordCount, 
      totalApiCost: totalApiCost.toFixed(2),
      estimatedHoursSaved, activeClients,
      mostUsedType, mostUsedModel
    }});
  } catch (error) { next(error); }
};

const getVolume = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const volume = await Output.aggregate([
      { $match: { 
        userId: req.user._id, 
        createdAt: { $gte: sevenDaysAgo } 
      }},
      { $group: { 
        _id: { $dateToString: { 
          format: '%Y-%m-%d', date: '$createdAt' 
        }},
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 }}
    ]);
    res.json({ success: true, volume });
  } catch (error) { next(error); }
};

const getBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Output.aggregate([
      { $match: { userId: req.user._id }},
      { $group: { 
        _id: '$contentType', count: { $sum: 1 } 
      }}
    ]);
    res.json({ success: true, breakdown });
  } catch (error) { next(error); }
};

module.exports = { getSummary, getVolume, getBreakdown };



