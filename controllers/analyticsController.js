const User = require('../models/User');
const Output = require('../models/Output');
const Client = require('../models/Client');
const geminiService = require('../services/gemini.service');
const performanceService = require('../services/performance.service');
const BrandProfile = require('../models/BrandProfile');

const getSummary = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    const baseQuery = { userId: req.user._id };
    if (clientId) baseQuery.clientId = clientId;

    const totalGenerations = await Output.countDocuments(baseQuery);
    const activeClients = await Client.countDocuments({ userId: req.user._id });
    const brandVoices = await BrandProfile.countDocuments({ userId: req.user._id });
    const outputsSaved = await Output.countDocuments({ 
      ...baseQuery,
      status: { $in: ['approved', 'completed'] } 
    });

    // Calculate Growth/Changes based on Range
    const range = req.query.range || '30d';
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const prevPeriodStart = new Date(now.getTime() - (2 * days * 24 * 60 * 60 * 1000));

    // Get current period counts
    const currentGens = await Output.countDocuments({ 
      ...baseQuery,
      createdAt: { $gte: periodStart } 
    });
    const currentClients = await Client.countDocuments({ 
      userId: req.user._id, 
      createdAt: { $gte: periodStart } 
    });

    // Get previous period counts
    const prevGens = await Output.countDocuments({ 
      ...baseQuery,
      createdAt: { $gte: prevPeriodStart, $lt: periodStart } 
    });
    const prevClients = await Client.countDocuments({ 
      userId: req.user._id, 
      createdAt: { $gte: prevPeriodStart, $lt: periodStart } 
    });

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const changes = {
      generations: calculateGrowth(currentGens, prevGens),
      clients: currentClients, // Just show new clients count for now as per original mock intent
      savingRate: totalGenerations > 0 ? Math.round((outputsSaved / totalGenerations) * 100) : 0
    };

    const avgPerDay = totalGenerations > 0 ? (totalGenerations / days).toFixed(1) : 0;

    res.json({ 
      success: true, 
      summary: {
        totalGenerations,
        activeClients,
        brandVoices,
        outputsSaved,
        avgPerDay,
        changes
      },
      totalGenerations,
      activeClients,
      brandVoices,
      outputsSaved,
      avgPerDay
    });
  } catch (error) { 
    console.error('[Analytics] Summary Error:', error);
    next(error); 
  }
};

const getVolume = async (req, res, next) => {
  try {
    const { range, clientId } = req.query;
    const days = parseInt(range) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchQuery = { 
      userId: req.user._id,
      createdAt: { $gte: startDate }
    };
    if (clientId) matchQuery.clientId = new (require('mongoose')).Types.ObjectId(clientId);

    const volume = await Output.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }},
        count: { $sum: 1 }
      }},
      { $project: {
        date: '$_id',
        count: 1,
        _id: 0
      }},
      { $sort: { date: 1 }}
    ]);

    res.json({ success: true, usageVolume: volume, activity: volume });
  } catch (error) { next(error); }
};

const getBreakdown = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    const matchQuery = { userId: req.user._id };
    if (clientId) matchQuery.clientId = new (require('mongoose')).Types.ObjectId(clientId);

    const breakdown = await Output.aggregate([
      { $match: matchQuery },
      { $group: {
        _id: '$contentType',
        value: { $sum: 1 }
      }},
      { $project: {
        name: { $ifNull: ['$_id', 'Other'] },
        value: 1,
        _id: 0
      }}
    ]);
    res.json({ success: true, breakdown, formats: breakdown });
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

const getTopClients = async (req, res, next) => {
  try {
    const topClients = await Output.aggregate([
      { $match: { userId: req.user._id } },
      { $group: {
        _id: '$clientId',
        count: { $sum: 1 }
      }},
      { $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }},
      { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
      { $project: {
        name: { $ifNull: ['$client.name', 'Private'] },
        count: 1
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json({ success: true, topClients });
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
  generateReport,
  getTopClients
};
