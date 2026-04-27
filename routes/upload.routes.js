const express = require('express');
const multer = require('multer');
const { uploadAvatar } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (we'll buffer the file then upload to R2)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

/**
 * POST /api/upload/avatar
 */
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;


