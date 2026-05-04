const mongoose = require('mongoose');

const outputSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  briefId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brief' },
  contentType: { type: String },
  generatedText: { type: String },
  modelUsed: { type: String },
  taskType: { type: String },
  wordCount: { type: Number },
  status: { 
    type: String,
    enum: ['pending','completed','approved','needsreview'],
    default: 'pending' 
  },
  exportUrl: { type: String },
  apiCost: { type: Number },
  factCheckResult: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
outputSchema.index({ userId: 1, clientId: 1 });
outputSchema.index({ userId: 1, contentType: 1 });
outputSchema.index({ userId: 1, createdAt: -1 }); // Dashboard queries: user's outputs sorted by newest
outputSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Output', outputSchema);



