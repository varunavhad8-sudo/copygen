const Client = require('../models/Client');
const BrandProfile = require('../models/BrandProfile');
const DOMPurify = require('isomorphic-dompurify');

const sanitizeBody = (body) => {
  const sanitized = {};
  for (const key in body) {
    sanitized[key] = typeof body[key] === 'string' ? DOMPurify.sanitize(body[key]) : body[key];
  }
  return sanitized;
};

const getAll = async (req, res, next) => {
  try {
    const clients = await Client.find({ userId: req.user._id })
      .populate('brandProfileId');
    res.json({ success: true, clients });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const client = await Client.create({ 
      ...sanitizeBody(req.body), userId: req.user._id 
    });
    res.status(201).json({ success: true, client });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      sanitizeBody(req.body), { new: true }
    );
    res.json({ success: true, client });
  } catch (error) { next(error); }
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



