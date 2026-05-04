const { google } = require('googleapis');
const { getAuthenticatedClient } = require('./googleAuth.service');
const llmRouter = require('./llmRouter');
const BrandProfile = require('../models/BrandProfile');

/**
 * 1. Fetches top 20 pages from Google Search Console.
 */
const getSearchConsoleData = async (userId, siteUrl, startDate, endDate) => {
  try {
    const client = await getAuthenticatedClient(userId);
    const searchconsole = google.searchconsole({ version: 'v1', auth: client });

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 20
      }
    });

    if (!response.data.rows) return { rows: [], summary: { totalClicks: 0, totalImpressions: 0, avgPosition: 0 } };

    const rows = response.data.rows.map(row => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2) + '%',
      position: row.position.toFixed(1)
    }));

    const summary = {
      totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
      totalImpressions: rows.reduce((sum, r) => sum + r.impressions, 0),
      avgPosition: rows.length > 0 ? (rows.reduce((sum, r) => sum + parseFloat(r.position), 0) / rows.length).toFixed(1) : 0
    };

    return { rows, summary };
  } catch (error) {
    console.error('[PerformanceService] Search Console Error:', error.message);
    throw error;
  }
};

/**
 * 1b. Fetches top 20 keywords from Google Search Console.
 */
const getSearchConsoleKeywords = async (userId, siteUrl, startDate, endDate) => {
  try {
    const client = await getAuthenticatedClient(userId);
    const searchconsole = google.searchconsole({ version: 'v1', auth: client });

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 20
      }
    });

    if (!response.data.rows) return [];

    return response.data.rows.map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: (row.ctr * 100).toFixed(2) + '%',
      position: row.position.toFixed(1)
    }));
  } catch (error) {
    console.error('[PerformanceService] Keywords Error:', error.message);
    throw error;
  }
};

/**
 * 2. Fetches top 20 pages from GA4.
 */
const getAnalyticsData = async (userId, propertyId, startDate, endDate) => {
  try {
    const client = await getAuthenticatedClient(userId);
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: client });

    const response = await analyticsdata.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' }
        ],
        limit: 20
      }
    });

    if (!response.data.rows) return { rows: [], summary: { totalSessions: 0, avgBounceRate: '0%' } };

    const rows = response.data.rows.map(row => ({
      page: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      bounceRate: (parseFloat(row.metricValues[1].value) * 100).toFixed(2) + '%',
      avgDuration: parseFloat(row.metricValues[2].value).toFixed(2) + 's'
    }));

    const summary = {
      totalSessions: rows.reduce((sum, r) => sum + r.sessions, 0),
      avgBounceRate: rows.length > 0 ? (rows.reduce((sum, r) => sum + parseFloat(r.bounceRate), 0) / rows.length).toFixed(2) + '%' : '0%'
    };

    return { rows, summary };
  } catch (error) {
    console.error('[PerformanceService] Analytics Error:', error.message);
    throw error;
  }
};

/**
 * 3. Analyzes performance data to identify content patterns and saves to BrandProfile.
 */
const analyzeContentPatterns = async (userId, clientId, performanceData, userPlan) => {
  try {
    const prompt = `
      Analyze the following performance data for a client's website. 
      Identify successful content patterns among the top-performing pages.
      
      Performance Data:
      ${JSON.stringify(performanceData, null, 2)}
      
      Return ONLY a JSON object with these fields:
      {
        "avgWordCount": number (estimate based on top pages),
        "headingStructure": string (pattern of H1, H2, H3),
        "tone": string (e.g., authoritative, conversational),
        "faqPresence": boolean (if top pages usually have FAQs),
        "ctaPatterns": string (common call-to-action styles)
      }
    `;

    const response = await llmRouter.processRequest({
      brief: { 
        briefText: prompt, 
        contentType: 'Content Analysis' 
      },
      clientId,
      userId,
      userPlan
    });

    // Extract JSON from response (llmRouter returns generatedText)
    const jsonStr = response.generatedText.replace(/```json|```/g, '').trim();
    const patterns = JSON.parse(jsonStr);

    // Save to BrandProfile
    await BrandProfile.findOneAndUpdate(
      { clientId },
      { 
        performancePatterns: {
          ...patterns,
          lastAnalyzed: new Date()
        },
        updatedAt: new Date()
      },
      { upsert: true }
    );

    return patterns;
  } catch (error) {
    console.error('[PerformanceService] Pattern Analysis Error:', error.message);
    throw error;
  }
};

/**
 * 4. Generates a comprehensive ROI report for the client.
 */
const generateROIReport = async (userId, clientId, siteUrl, propertyId, startDate, endDate, userPlan) => {
  try {
    const [scData, gaData] = await Promise.all([
      getSearchConsoleData(userId, siteUrl, startDate, endDate),
      getAnalyticsData(userId, propertyId, startDate, endDate)
    ]);

    const performanceData = {
      searchConsole: scData,
      analytics: gaData
    };

    const patterns = await analyzeContentPatterns(userId, clientId, performanceData, userPlan);

    const prompt = `
      Generate a professional Monthly ROI Content Report based on the following data.
      
      Performance Summary:
      ${JSON.stringify(performanceData, null, 2)}
      
      Identified Successful Patterns:
      ${JSON.stringify(patterns, null, 2)}
      
      The report should include:
      1. Executive Summary
      2. Key Performance Metrics (Clicks, Sessions, CTR)
      3. Content Strategy Recommendations (based on identified patterns)
      4. Projected Growth
      
      Return as JSON:
      {
        "summary": "Detailed markdown summary...",
        "metrics": [
          { "label": "Total Clicks", "value": "..." },
          ...
        ]
      }
    `;

    const reportResponse = await llmRouter.processRequest({
      brief: { 
        briefText: prompt, 
        contentType: 'ROI Report' 
      },
      clientId,
      userId,
      userPlan
    });

    const reportJson = JSON.parse(reportResponse.generatedText.replace(/```json|```/g, '').trim());

    return {
      ...reportJson,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('[PerformanceService] ROI Report Error:', error.message);
    throw error;
  }
};

module.exports = {
  getSearchConsoleData,
  getSearchConsoleKeywords,
  getAnalyticsData,
  analyzeContentPatterns,
  generateROIReport
};
