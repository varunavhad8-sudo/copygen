const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  category: { type: String, default: 'Other' },
  description: { type: String },
  contentType: { type: String },
  promptStructure: { type: String },
  briefText: { type: String },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Indexes
templateSchema.index({ userId: 1, name: 1 });

// Pre-save middleware to sync promptStructure and briefText
templateSchema.pre('save', function() {
  if (this.promptStructure && !this.briefText) {
    this.briefText = this.promptStructure;
  } else if (this.briefText && !this.promptStructure) {
    this.promptStructure = this.briefText;
  }
});

module.exports = mongoose.model('Template', templateSchema);




