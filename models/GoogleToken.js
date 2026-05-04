const mongoose = require('mongoose');

const googleTokenSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  accessToken: { 
    type: String 
  },
  refreshToken: { 
    type: String 
  },
  expiry: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // This will automatically handle createdAt and updatedAt
});

module.exports = mongoose.model('GoogleToken', googleTokenSchema);
