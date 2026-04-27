const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  contentType: { type: String },
  briefText: { type: String, required: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
templateSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Template', templateSchema);



