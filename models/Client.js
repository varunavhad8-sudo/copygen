const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
  },
  name: { type: String, required: true },
  industry: { type: String },
  website: { type: String },
  siteUrl: { type: String, default: '' },
  ga4PropertyId: { type: String, default: '' },
  scSiteUrl: { type: String },
  targetAudience: { type: String },
  brandProfileId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BrandProfile' 
  },
  outputCount: { type: Number, default: 0 },
  lastActiveAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
clientSchema.index({ userId: 1, name: 1 });
clientSchema.index({ userId: 1 });

module.exports = mongoose.model('Client', clientSchema);



