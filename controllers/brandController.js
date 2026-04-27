const BrandProfile = require('../models/BrandProfile');
const Client = require('../models/Client');
const { buildPrompt, clearBrandCache } = require('../services/brandMemory.service');
const DOMPurify = require('isomorphic-dompurify');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/brand/:clientId
// Returns the brand identity for a specific client, scoped to the current user.
// ─────────────────────────────────────────────────────────────────────────────
const getByClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    console.log('[BrandController] Fetching Brand Identity for client:', clientId);

    // 1. Verify the client belongs to this user
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // 2. Fetch BrandProfile — scoped to BOTH clientId AND userId
    const profile = await BrandProfile.findOne({ clientId, userId: req.user._id });

    // 3. Robust Merge: Use profile data if it exists, otherwise fallback to client data
    const brandIdentity = {
      clientId: client._id,
      clientName: client.name,
      // Priority: Profile > Client > Default
      industry: profile?.industry || client.industry || 'Marketing Agency',
      website: profile?.website || client.website || '',
      targetAudience: profile?.targetAudience || client.targetAudience || '',

      // Voice Specifics (only in Profile)
      selectedTones: profile?.selectedTones || [],
      formality: profile?.formality ?? 50,
      sentenceStyle: profile?.sentenceStyle || 'Mixed length',
      avoidWords: profile?.avoidWords || [],
      powerWords: profile?.powerWords || [],
      brandColors: profile?.brandColors || [],
      competitors: profile?.competitors || [],
      usps: profile?.usps || [],
      ctaStyle: profile?.ctaStyle || 'Medium',
      exampleText1: profile?.exampleText1 || '',
      exampleText2: profile?.exampleText2 || '',

      isNew: !profile // Flag if user hasn't saved memory yet
    };

    console.log('[BrandController] Merged Identity:', {
      name: brandIdentity.clientName,
      website: brandIdentity.website,
      audience: brandIdentity.targetAudience,
      hasProfile: !!profile
    });

    res.json({ success: true, profile: brandIdentity });
  } catch (error) {
    console.error('[BrandController] Fetch Error:', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/brand
// Creates or updates a BrandProfile for a client. Strictly scoped to the user.
// ─────────────────────────────────────────────────────────────────────────────
const save = async (req, res, next) => {
  try {
    const {
      clientId, clientName, industry, website, targetAudience,
      selectedTones, formality, sentenceStyle, avoidWords, powerWords,
      brandColors, competitors, usps, ctaStyle,
      exampleText1, exampleText2
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'clientId is required' });
    }

    // Verify the client belongs to this user before allowing save
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(403).json({ success: false, message: 'Forbidden: client does not belong to you' });
    }

    console.log('[BrandController] Save Request received for:', clientName || clientId);

    const sanitizeStr = (s) => (typeof s === 'string' ? DOMPurify.sanitize(s) : s);
    const sanitizeArr = (arr) => (Array.isArray(arr) ? arr.map(sanitizeStr) : arr);

    const updateData = {
      clientId,
      userId: req.user._id,
      clientName: sanitizeStr(clientName),
      industry: sanitizeStr(industry),
      website: sanitizeStr(website),
      targetAudience: sanitizeStr(targetAudience),
      selectedTones: sanitizeArr(selectedTones),
      formality,
      sentenceStyle: sanitizeStr(sentenceStyle),
      avoidWords: sanitizeArr(avoidWords),
      powerWords: sanitizeArr(powerWords),
      brandColors: sanitizeArr(brandColors),
      competitors: sanitizeArr(competitors),
      usps: sanitizeArr(usps),
      ctaStyle: sanitizeStr(ctaStyle),
      exampleText1: sanitizeStr(exampleText1),
      exampleText2: sanitizeStr(exampleText2),
      updatedAt: new Date()
    };

    // Build the system prompt using this data
    updateData.systemPromptPreview = buildPrompt(updateData);

    // Query uses BOTH clientId and userId — prevents cross-user profile modification
    const profile = await BrandProfile.findOneAndUpdate(
      { clientId, userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Sync back to Client record
    await Client.findByIdAndUpdate(clientId, {
      brandProfileId: profile._id,
      industry: updateData.industry,
      website: updateData.website,
      targetAudience: updateData.targetAudience
    });

    // Invalidate Redis Cache
    await clearBrandCache(clientId, req.user._id);

    console.log('[BrandController] Profile successfully updated and Cache Invalidated.');

    res.json({ success: true, profile });
  } catch (error) {
    console.error('[BrandController] Save Error:', error);
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/brand/:clientId
// Deletes a BrandProfile — strictly verified against the current user.
// ─────────────────────────────────────────────────────────────────────────────
const remove = async (req, res, next) => {
  try {
    const { clientId } = req.params;

    // Verify the client belongs to this user
    const client = await Client.findOne({ _id: clientId, userId: req.user._id });
    if (!client) {
      return res.status(403).json({ success: false, message: 'Forbidden: client does not belong to you' });
    }

    // Delete profile scoped to BOTH clientId AND userId — never just { clientId }
    const deleted = await BrandProfile.findOneAndDelete({ clientId, userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Brand profile not found' });
    }

    // Invalidate cache
    await clearBrandCache(clientId, req.user._id);

    console.log(`[BrandController] Brand profile deleted for client ${clientId}, user ${req.user._id}`);
    res.json({ success: true, message: 'Brand profile deleted' });
  } catch (error) {
    console.error('[BrandController] Delete Error:', error);
    next(error);
  }
};

module.exports = { getByClient, save, remove };
