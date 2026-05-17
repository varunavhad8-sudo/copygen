const Output = require('../models/Output');

const getAll = async (req, res, next) => {
  try {
    const { contentType, status, search, clientId, 
            page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    
    if (contentType) query.contentType = contentType;
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    if (search) query.generatedText = { 
      $regex: search, $options: 'i' 
    };

    const total = await Output.countDocuments(query);
    const outputs = await Output.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('clientId', 'name');

    res.json({ 
      success: true, 
      outputs,
      total,
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const output = await Output.findOne({ 
      _id: req.params.id, userId: req.user._id 
    });
    if (!output) return res.status(404).json({ 
      message: 'Output not found' 
    });
    res.json({ success: true, output });
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const output = await Output.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, output });
  } catch (error) { next(error); }
};

const deleteOutput = async (req, res, next) => {
  try {
    await Output.findOneAndDelete({ 
      _id: req.params.id, userId: req.user._id 
    });
    res.json({ success: true, message: 'Output deleted' });
  } catch (error) { next(error); }
};

const getRecent = async (req, res, next) => {
  try {
    const outputs = await Output.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('clientId', 'name');
    res.json({ success: true, outputs });
  } catch (error) { next(error); }
};

module.exports = { getAll, getOne, updateStatus, deleteOutput, getRecent };



