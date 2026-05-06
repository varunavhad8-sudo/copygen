const { getAuthUrl, handleCallback } = require('../services/googleAuth.service');
const GoogleToken = require('../models/GoogleToken');

/**
 * Generates the Google OAuth URL for the user to connect their account.
 */
const getUrl = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const authUrl = getAuthUrl(userId);
    
    // Check if user is already connected
    const token = await GoogleToken.findOne({ userId });
    const isConnected = !!token;

    console.log('[Analytics] Auth Check Response:', { url: authUrl, connected: isConnected });
    
    res.json({ 
      url: authUrl, 
      connected: isConnected 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles the redirect from Google OAuth.
 * Exchanges the code for tokens and saves them.
 */
const callback = async (req, res, next) => {
  try {
    const { code, state: userId } = req.query;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code missing' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User state missing' });
    }

    // Exchange code for tokens and save to DB
    await handleCallback(code, userId);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Redirect user back to the frontend settings page
    res.redirect(`${clientUrl}/app/settings?google=connected`);

  } catch (error) {
    console.error('[GoogleAuthController] Callback error:', error.message);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // On error, redirect to settings with error flag
    res.redirect(`${clientUrl}/app/settings?google=error`);
  }
};

module.exports = {
  getUrl,
  callback
};
