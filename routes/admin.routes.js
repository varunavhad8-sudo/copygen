const express = require('express');
const { runMonthlyReset } = require('../jobs/monthlyReset');
const { strictLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');
const Output = require('../models/Output');

const router = express.Router();

// ─── Price Constants (matches RazorpayCheckout.jsx) ───────────────────────────
const PLAN_PRICES = {
  starter: { monthly: 8199,  yearly: 88549  },
  growth:  { monthly: 16399, yearly: 177109 },
  agency:  { monthly: 32799, yearly: null   },
};

// ─── Admin Secret Middleware ──────────────────────────────────────────────────
const requireAdminSecret = (req, res, next) => {
  const secret = req.headers['admin_secret'] || req.headers['admin-secret'];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden: Invalid or missing Admin Secret' });
  }
  next();
};

// Apply to all routes in this router
router.use(requireAdminSecret);

// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/stats
 * Returns user statistics by plan for the admin dashboard.
 */
router.get('/stats', strictLimiter, async (req, res) => {
  try {
    const [planStats, totalUsers, recentUsers] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      User.countDocuments(),
      User.find({}, 'name email plan createdAt generationsUsed')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const planBreakdown = { free: 0, starter: 0, growth: 0, agency: 0 };
    planStats.forEach(p => { if (p._id) planBreakdown[p._id] = p.count; });

    const paidUsers = (planBreakdown.starter || 0) + (planBreakdown.growth || 0) + (planBreakdown.agency || 0);
    const conversionRate = totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        paidUsers,
        conversionRate,
        planBreakdown,
        recentUsers: recentUsers.map(u => ({
          name: u.name || 'Unknown',
          email: u.email,
          plan: u.plan,
          generationsUsed: u.generationsUsed,
          joinedAt: u.createdAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
});

/**
 * GET /api/admin/health
 * Returns system health details.
 */
router.get('/health', async (req, res) => {
  try {
    const dbStatus = await User.countDocuments().then(() => 'connected').catch(() => 'error');
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        db: dbStatus,
        uptime: Math.floor(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/users
 * Search, filter, and paginate all users.
 * Query: ?search=email&plan=free&page=1&limit=25
 */
router.get('/users', strictLimiter, async (req, res) => {
  try {
    const { search = '', plan = '', page = 1, limit = 25 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (plan) query.plan = plan;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name:  { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query, 
        'name email plan planType generationsUsed generationsLimit brandVoicesUsed ' +
        'createdAt currentPeriodEnd scheduledDowngrade razorpaySubscriptionId ' +
        'dodoSubscriptionId isBanned banReason onboardingCompleted'
      )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

/**
 * POST /api/admin/users
 * Manually register a new user in the system.
 */
router.post('/users', strictLimiter, async (req, res) => {
  try {
    const { email, name, plan, durationDays, firebaseUid } = req.body;
    
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User with this email already exists' });

    const planLimitsMap = {
      free:    { maxGenerations: 10,   maxBrandVoices: 1   },
      starter: { maxGenerations: 300,  maxBrandVoices: 10  },
      growth:  { maxGenerations: 1000, maxBrandVoices: 30  },
      agency:  { maxGenerations: 3000, maxBrandVoices: 100 },
    };

    const periodEnd = durationDays 
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) 
      : null;

    const newUser = new User({
      email,
      name: name || 'Manual Registration',
      firebaseUid: firebaseUid || `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      plan: plan || 'free',
      planLimits: planLimitsMap[plan] || planLimitsMap.free,
      generationsLimit: planLimitsMap[plan]?.maxGenerations || 10,
      currentPeriodEnd: periodEnd,
      onboardingCompleted: true,
      planType: plan && plan !== 'free' ? 'razorpay' : 'free' // Mark as managed
    });

    await newUser.save();
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Edit a user — plan override, generation limit, duration, ban/unban.
 */
router.patch('/users/:id', strictLimiter, async (req, res) => {
  try {
    const { plan, generationsLimit, isBanned, banReason, currentPeriodEnd } = req.body;
    const updates = {};

    if (plan !== undefined) {
      const planLimitsMap = {
        free:    { maxGenerations: 10,   maxBrandVoices: 1   },
        starter: { maxGenerations: 300,  maxBrandVoices: 10  },
        growth:  { maxGenerations: 1000, maxBrandVoices: 30  },
        agency:  { maxGenerations: 3000, maxBrandVoices: 100 },
      };
      updates.plan = plan;
      updates.planLimits = planLimitsMap[plan] || planLimitsMap.free;
      updates.generationsLimit = planLimitsMap[plan]?.maxGenerations || 10;
      
      // If upgrading to paid manually, ensure they aren't marked as 'free' planType
      if (plan !== 'free') updates.planType = 'razorpay';
      else updates.planType = 'free';
    }

    if (generationsLimit !== undefined) updates.generationsLimit = parseInt(generationsLimit);
    if (isBanned !== undefined)  updates.isBanned = isBanned;
    if (banReason !== undefined) updates.banReason = banReason;
    if (currentPeriodEnd !== undefined) updates.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, lean: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Permanently remove a user and their data.
 */
router.delete('/users/:id', strictLimiter, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optionally cleanup related data (outputs, brandvoices, etc.)
    await Output.deleteMany({ userId: req.params.id });
    
    res.status(200).json({ success: true, message: `User ${user.email} permanently deleted.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

/**
 * POST /api/admin/users/:id/reset
 * Reset a single user's generation count to 0.
 */
router.post('/users/:id/reset', strictLimiter, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { generationsUsed: 0 } },
      { new: true, lean: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ success: true, message: `Reset generations for ${user.email}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset user', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// REVENUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/revenue
 * Revenue metrics proxied from plan counts × price constants.
 */
router.get('/revenue', strictLimiter, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [planCounts, newPaidThisMonth, newPaidLastMonth, churned, expired] = await Promise.all([
      User.aggregate([
        { $match: { plan: { $in: ['starter', 'growth', 'agency'] } } },
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ plan: { $in: ['starter', 'growth', 'agency'] }, createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ plan: { $in: ['starter', 'growth', 'agency'] }, createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } }),
      User.countDocuments({ scheduledDowngrade: true }),
      User.countDocuments({ plan: { $nin: ['free'] }, currentPeriodEnd: { $lt: now } }),
    ]);

    // MRR estimate
    const planMap = {};
    planCounts.forEach(p => { planMap[p._id] = p.count; });
    const mrr = 
      (planMap.starter || 0) * PLAN_PRICES.starter.monthly +
      (planMap.growth  || 0) * PLAN_PRICES.growth.monthly  +
      (planMap.agency  || 0) * PLAN_PRICES.agency.monthly;
    const arr = mrr * 12;

    // 6-month paid user growth (signups per month for past 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyGrowth = await User.aggregate([
      { $match: { plan: { $in: ['starter', 'growth', 'agency'] }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fill missing months
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const entry = monthlyGrowth.find(m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1);
      chartData.push({ month: monthNames[d.getMonth()], paid: entry?.count || 0 });
    }

    res.status(200).json({
      success: true,
      data: {
        mrr, arr,
        planBreakdown: planMap,
        newPaidThisMonth,
        newPaidLastMonth,
        paidGrowthPct: newPaidLastMonth > 0 
          ? (((newPaidThisMonth - newPaidLastMonth) / newPaidLastMonth) * 100).toFixed(1) 
          : null,
        churned,
        expiredSubscriptions: expired,
        chartData,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI COST MONITOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ai-usage
 * Aggregated AI cost and usage from the Output model.
 */
router.get('/ai-usage', strictLimiter, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalAgg, thisMonthAgg, lastMonthAgg, modelBreakdown, topUsers] = await Promise.all([
      Output.aggregate([{ $group: { _id: null, totalCost: { $sum: '$apiCost' }, totalGenerations: { $sum: 1 } } }]),
      Output.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, cost: { $sum: '$apiCost' } } }]),
      Output.aggregate([{ $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } }, { $group: { _id: null, cost: { $sum: '$apiCost' } } }]),
      Output.aggregate([
        { $group: { _id: '$modelUsed', cost: { $sum: '$apiCost' }, count: { $sum: 1 } } },
        { $sort: { cost: -1 } }
      ]),
      Output.aggregate([
        { $group: { _id: '$userId', totalCost: { $sum: '$apiCost' }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { totalCost: 1, count: 1, 'user.name': 1, 'user.email': 1, 'user.plan': 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCost:        totalAgg[0]?.totalCost || 0,
        totalGenerations: totalAgg[0]?.totalGenerations || 0,
        thisMonthCost:    thisMonthAgg[0]?.cost || 0,
        lastMonthCost:    lastMonthAgg[0]?.cost || 0,
        modelBreakdown:   modelBreakdown.map(m => ({ name: m._id || 'Unknown', cost: m.cost, count: m.count })),
        topUsers:         topUsers.map(u => ({
          name:      u.user?.name || 'Unknown',
          email:     u.user?.email || 'N/A',
          plan:      u.user?.plan  || 'free',
          totalCost: u.totalCost,
          count:     u.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI usage', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT AUDIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/outputs
 * Paginated log of all AI outputs across all users.
 * Query: ?userId=&contentType=&modelUsed=&page=1&limit=30
 */
router.get('/outputs', strictLimiter, async (req, res) => {
  try {
    const { userId, contentType, modelUsed, page = 1, limit = 30 } = req.query;
    const query = {};
    if (userId)      query.userId = userId;
    if (contentType) query.contentType = contentType;
    if (modelUsed)   query.modelUsed = modelUsed;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [outputs, total] = await Promise.all([
      Output.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'name email plan')
        .lean(),
      Output.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        outputs: outputs.map(o => ({
          _id:          o._id,
          user:         { name: o.userId?.name, email: o.userId?.email, plan: o.userId?.plan },
          contentType:  o.contentType,
          modelUsed:    o.modelUsed,
          wordCount:    o.wordCount,
          apiCost:      o.apiCost,
          status:       o.status,
          preview:      o.generatedText?.slice(0, 200),
          createdAt:    o.createdAt
        })),
        total,
        page:       parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch outputs', details: error.message });
  }
});

/**
 * PATCH /api/admin/outputs/:id
 * Flag or approve a specific output.
 */
router.patch('/outputs/:id', strictLimiter, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'completed', 'approved', 'needsreview'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const output = await Output.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, lean: true }
    );
    if (!output) return res.status(404).json({ error: 'Output not found' });
    res.status(200).json({ success: true, data: output });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update output', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GROWTH ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics
 * Business growth metrics.
 */
router.get('/analytics', strictLimiter, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [signupsPerDay, featureUsage, totalPaid, onboardingDone, churned] = await Promise.all([
      // Daily signups for last 30 days
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      // Content type breakdown from outputs
      Output.aggregate([
        { $group: { _id: '$contentType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      User.countDocuments({ plan: { $in: ['starter', 'growth', 'agency'] } }),
      User.countDocuments({ onboardingCompleted: true }),
      User.countDocuments({ scheduledDowngrade: true }),
    ]);

    const totalUsers = await User.countDocuments();

    // Fill all 30 days
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const entry = signupsPerDay.find(s => s._id === key);
      dailyData.push({ date: key, signups: entry?.count || 0 });
    }

    const onboardingRate = totalUsers > 0 ? ((onboardingDone / totalUsers) * 100).toFixed(1) : 0;
    const churnRate = totalPaid > 0 ? ((churned / totalPaid) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        signupsPerDay: dailyData,
        featureUsage: featureUsage.map(f => ({ name: f._id || 'Unknown', count: f.count })),
        conversionFunnel: {
          totalUsers,
          totalPaid,
          conversionRate: totalUsers > 0 ? ((totalPaid / totalUsers) * 100).toFixed(1) : 0
        },
        onboardingRate,
        churnRate
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DANGER ZONE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/reset-usage
 * Triggers the monthly generation reset for ALL users.
 */
router.post('/reset-usage', strictLimiter, async (req, res) => {
  try {
    const count = await runMonthlyReset();
    res.status(200).json({ 
      success: true, 
      message: `Manual reset triggered successfully. ${count} users affected.` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset usage', details: error.message });
  }
});

module.exports = router;
