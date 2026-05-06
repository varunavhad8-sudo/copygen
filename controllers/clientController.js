const Client = require('../models/Client');
const BrandProfile = require('../models/BrandProfile');
const DOMPurify = require('isomorphic-dompurify');

const ALLOWED_FIELDS = ['name', 'industry', 'website', 'siteUrl', 'ga4PropertyId', 'scSiteUrl', 'targetAudience'];

const sanitizeBody = (body) => {
  const sanitized = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      sanitized[key] = typeof body[key] === 'string' ? DOMPurify.sanitize(body[key]) : body[key];
    }
  }
  return sanitized;
};

const { getDbStatus } = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, error: 'Unauthorized: User not found in request context' });
    }

    if (!getDbStatus()) {
      return res.status(503).json({ success: false, error: 'Database not ready' });
    }

    const clients = await Client.find({ userId: req.user._id })
      .populate('brandProfileId');
    res.json({ success: true, clients });
  } catch (error) { 
    console.error('[Clients] GET All Error:', error);
    next(error); 
  }
};

const create = async (req, res, next) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not ready' });
    if (!req.user?._id) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const client = await Client.create({ 
      ...sanitizeBody(req.body), userId: req.user._id 
    });
    res.status(201).json({ success: true, client });
  } catch (error) { 
    console.error('[Clients] CREATE Error:', error);
    next(error); 
  }
};

const update = async (req, res, next) => {
  try {
    if (!getDbStatus()) return res.status(503).json({ success: false, error: 'Database not ready' });
    if (!req.user?._id) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      sanitizeBody(req.body), { new: true }
    );
    res.json({ success: true, client });
  } catch (error) { 
    console.error('[Clients] UPDATE Error:', error);
    next(error); 
  }
};

const remove = async (req, res, next) => {
  try {
    await Client.findOneAndDelete({ 
      _id: req.params.id, userId: req.user._id 
    });
    await BrandProfile.findOneAndDelete({ 
      clientId: req.params.id,
      userId: req.user._id
    });
    res.json({ success: true, message: 'Client deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, update, remove };



