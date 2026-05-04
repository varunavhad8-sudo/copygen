const { google } = require('googleapis');
const GoogleToken = require('../models/GoogleToken');

/**
 * Creates a pre-configured OAuth2 client using environment variables.
 */
const createClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

/**
 * 1. Generates the Google OAuth2 consent URL.
 * @param {string} userId - The user's ID to be passed as state to the callback.
 * @returns {string} The consent URL.
 */
const getAuthUrl = (userId) => {
  const client = createClient();
  
  const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];

  return client.generateAuthUrl({
    access_type: 'offline', // Required to get refresh_token
    scope: scopes,
    state: userId, // Pass userId to callback via state parameter
    prompt: 'consent' // Force consent to ensure we get a refresh token every time
  });
};

/**
 * 2. Exchanges the authorization code for tokens and saves them.
 * @param {string} code - Code returned by Google callback.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Object>} The saved GoogleToken document.
 */
const handleCallback = async (code, userId) => {
  const client = createClient();
  const { tokens } = await client.getToken(code);
  
  const updateData = {
    accessToken: tokens.access_token,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    updatedAt: new Date()
  };

  // Only update refreshToken if provided (usually only on first consent)
  if (tokens.refresh_token) {
    updateData.refreshToken = tokens.refresh_token;
  }

  const tokenDoc = await GoogleToken.findOneAndUpdate(
    { userId },
    updateData,
    { upsert: true, new: true }
  );

  return tokenDoc;
};

/**
 * 3. Returns an authenticated OAuth2 client for the user.
 * Handles automatic token refresh.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Object>} Authenticated google.auth.OAuth2 client.
 */
const getAuthenticatedClient = async (userId) => {
  const tokenDoc = await GoogleToken.findOne({ userId });
  if (!tokenDoc) {
    const error = new Error('Google account not connected. Please authenticate first.');
    error.status = 401;
    throw error;
  }

  const client = createClient();
  
  client.setCredentials({
    access_token: tokenDoc.accessToken,
    refresh_token: tokenDoc.refreshToken,
    expiry_date: tokenDoc.expiry ? tokenDoc.expiry.getTime() : null
  });

  // Listen for automatic token refreshes and update the database
  client.on('tokens', async (tokens) => {
    const update = {
      accessToken: tokens.access_token,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      updatedAt: new Date()
    };
    if (tokens.refresh_token) {
      update.refreshToken = tokens.refresh_token;
    }
    await GoogleToken.updateOne({ userId }, update);
  });

  return client;
};

module.exports = {
  getAuthUrl,
  handleCallback,
  getAuthenticatedClient
};
