const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema({
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', required: true, unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
  },
  clientName: { type: String },
  selectedTones: [String],
  formality: { type: Number, default: 50 },
  sentenceStyle: { 
    type: String, 
    enum: ['Short & punchy', 'Mixed length', 'Long-form'],
    default: 'Mixed length' 
  },
  avoidWords: [String],
  powerWords: [String],
  brandColors: [String],
  competitors: [String],
  usps: [String],
  ctaStyle: { type: String, default: 'Medium' },
  targetAudience: { type: String },
  industry: { type: String },
  website: { type: String },
  exampleText1: { type: String },
  exampleText2: { type: String },
  systemPromptPreview: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
brandProfileSchema.index({ clientId: 1, userId: 1 }, { unique: true });
brandProfileSchema.index({ userId: 1 });
brandProfileSchema.index({ userId: 1, updatedAt: -1 }); // Brand voice dashboard: user's profiles by last updated

module.exports = mongoose.model('BrandProfile', brandProfileSchema);



