const Template = require('../models/Template');
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
    const templates = await Template.find({ 
      userId: req.user._id 
    }).sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = sanitizeBody(req.body);
    if (data.promptStructure && !data.briefText) {
      data.briefText = data.promptStructure;
    }
    const template = await Template.create({ 
      ...data, userId: req.user._id 
    });
    res.status(201).json({ success: true, template });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const data = sanitizeBody(req.body);
    if (data.promptStructure && !data.briefText) {
      data.briefText = data.promptStructure;
    }
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data, { new: true }
    );
    res.json({ success: true, template });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await Template.findOneAndDelete({ 
      _id: req.params.id, userId: req.user._id 
    });
    res.json({ success: true, message: 'Template deleted' });
  } catch (error) { next(error); }
};

const use = async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    res.json({ success: true, briefText: template.briefText });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, update, remove, use };



