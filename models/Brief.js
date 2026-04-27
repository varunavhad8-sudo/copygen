const mongoose = require('mongoose');

const briefSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  contentType: { type: String },
  briefText: { type: String, required: true },
  toneOverride: { type: String },
  additionalContext: { type: String },
  status: { 
    type: String,
    enum: ['pending','completed','failed'],
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
briefSchema.index({ userId: 1, clientId: 1 });
briefSchema.index({ userId: 1, status: 1 });
briefSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Brief', briefSchema);



