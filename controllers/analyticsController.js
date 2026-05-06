const User = require('../models/User');
const Output = require('../models/Output');
const Client = require('../models/Client');
const geminiService = require('../services/gemini.service');
const performanceService = require('../services/performance.service');
const BrandProfile = require('../models/BrandProfile');

const getSummary = async (req, res, next) => {
  try {
    const totalOutputs = await Output.countDocuments({ userId: req.user._id });
    const stats = await Output.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: null,
        totalWordCount: { $sum: '$wordCount' },
        totalApiCost: { $sum: '$apiCost' },
        mostUsedType: { $top: { sortBy: { count: -1 }, output: '$_id' } },
        typeCounts: { $push: '$contentType' }
      }}
    ]);

    const result = stats[0] || { totalWordCount: 0, totalApiCost: 0, typeCounts: [] };
    
    // Process type counts manually for accuracy
    const typeCounts = result.typeCounts.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const mostUsedType = Object.entries(typeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const totalWordCount = result.totalWordCount;
    const totalApiCost = result.totalApiCost;
    const estimatedHoursSaved = Math.round(totalWordCount / 250); // 250 words per hour estimate
    const activeClients = await Client.countDocuments({ userId: req.user._id });
    const mostUsedModel = 'Gemini 1.5 Pro';

    res.json({ success: true, summary: {
      totalOutputs, totalWordCount, 
      totalApiCost: totalApiCost.toFixed(2),
      estimatedHoursSaved, activeClients,
      mostUsedType, mostUsedModel,
      typeCounts
    }});
  } catch (error) { next(error); }
};

const getVolume = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageVolume = await Output.aggregate([
      { $match: { 
        userId: req.user._id,
        createdAt: { $gte: thirtyDaysAgo }
      }},
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }},
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 }}
    ]);

    res.json({ success: true, usageVolume });
  } catch (error) { next(error); }
};

const getBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Output.aggregate([
      { $match: { userId: req.user._id }},
      { $group: {
        _id: '$contentType',
        count: { $sum: 1 }
      }}
    ]);
    res.json({ success: true, breakdown });
  } catch (error) { next(error); }
};

const getSearchConsoleData = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate } = req.query;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    if (!client.siteUrl) return res.status(400).json({ success: false, message: 'Client has no siteUrl configured' });

    const { rows, summary } = await performanceService.getSearchConsoleData(
      req.user._id,
      client.siteUrl,
      startDate,
      endDate
    );
    res.json({ success: true, data: rows, summary });
  } catch (error) { next(error); }
};

const getKeywords = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate } = req.query;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    if (!client.siteUrl) return res.status(400).json({ success: false, message: 'Client has no siteUrl configured' });

    const data = await performanceService.getSearchConsoleKeywords(
      req.user._id,
      client.siteUrl,
      startDate,
      endDate
    );
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const getGA4Data = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate } = req.query;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    
    const propertyId = client.ga4PropertyId || req.query.propertyId;
    if (!propertyId) return res.status(400).json({ success: false, message: 'GA4 Property ID not configured' });

    const { rows, summary } = await performanceService.getAnalyticsData(
      req.user._id,
      propertyId,
      startDate,
      endDate
    );
    res.json({ success: true, data: rows, summary });
  } catch (error) { next(error); }
};

const getPatterns = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    const profile = await BrandProfile.findOne({ clientId, userId: req.user._id });
    res.json({ 
      success: true, 
      patterns: profile?.performancePatterns || {} 
    });
  } catch (error) { next(error); }
};

const generateReport = async (req, res, next) => {
  try {
    const { clientId, startDate, endDate } = req.body;
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    if (!client.siteUrl || !client.ga4PropertyId) {
      const prompt = `Generate a placeholder content strategy report for ${client.name}. Tracking is NOT yet configured. Provide industry insights and a setup checklist.`;
      const geminiRes = await geminiService.generateWithGemini(prompt);
      return res.json({ 
        success: true, 
        report: { summary: geminiRes, metrics: [], generatedAt: new Date(), hasRealData: false }
      });
    }

    const report = await performanceService.generateROIReport(
      req.user._id,
      client._id,
      client.siteUrl,
      client.ga4PropertyId,
      startDate,
      endDate,
      req.user.plan
    );

    res.json({ success: true, report: { ...report, hasRealData: true } });
  } catch (error) { next(error); }
};

module.exports = { 
  getSummary, 
  getVolume, 
  getBreakdown,
  getSearchConsoleData,
  getKeywords,
  getGA4Data,
  getPatterns,
  generateReport
};
