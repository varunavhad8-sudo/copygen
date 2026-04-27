const { uploadToR2, getPresignedUrl } = require('../services/storage.service');
const User = require('../models/User');

/**
 * Handle user avatar upload.
 * Stores the file KEY in the database (not a public URL).
 * Returns a short-lived signed URL for immediate display.
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    const fileKey = `avatars/${req.user._id}/${Date.now()}-${file.originalname}`;

    // 1. Upload to R2 — returns the file KEY, not a public URL
    const storedKey = await uploadToR2(fileKey, file.buffer, file.mimetype);

    // 2. Update User Profile with the key (not public URL)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarKey: storedKey },  // Store key, not URL
      { new: true }
    );

    // 3. Generate a 15-minute signed URL for immediate client use
    const signedUrl = await getPresignedUrl(storedKey);

    console.log('[UploadController] Avatar updated for user:', req.user._id);

    res.json({
      success: true,
      avatarUrl: signedUrl,  // Short-lived signed URL for this session
      user
    });
  } catch (error) {
    console.error('[UploadController] Upload Error:', error);
    next(error);
  }
};

/**
 * Get a fresh signed URL for an existing avatar key.
 * Call this when the previous signed URL has expired.
 */
const getAvatarUrl = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.avatarKey) {
      return res.status(404).json({ success: false, message: 'No avatar found' });
    }

    const signedUrl = await getPresignedUrl(user.avatarKey);
    res.json({ success: true, avatarUrl: signedUrl });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAvatar, getAvatarUrl };
