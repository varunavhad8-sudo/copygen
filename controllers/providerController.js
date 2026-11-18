const User = require('../models/User');
const {
  ALLOWED_PROVIDERS,
  assertProvider,
  encryptApiKey,
  decryptApiKey,
  maskApiKey
} = require('../services/providerKeys.service');

const getProviderSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+providerKeys activeProvider').lean();
    const settings = {};

    for (const provider of ALLOWED_PROVIDERS) {
      const encrypted = user?.providerKeys?.[provider];
      let masked = null;
      if (encrypted) masked = maskApiKey(decryptApiKey(encrypted));
      settings[provider] = { configured: !!encrypted, masked };
    }

    res.json({
      success: true,
      data: {
        activeProvider: user?.activeProvider || 'gemini',
        providers: settings,
        environmentFallback: process.env.NODE_ENV !== 'production'
      }
    });
  } catch (error) {
    next(error);
  }
};

const saveProviderKey = async (req, res, next) => {
  try {
    const { provider } = req.params;
    assertProvider(provider);

    const apiKey = String(req.body.apiKey || '').trim();
    if (!apiKey) {
      const error = new Error('apiKey is required');
      error.status = 400;
      throw error;
    }

    const user = await User.findById(req.user._id).select('+providerKeys activeProvider');
    user.providerKeys = user.providerKeys || {};
    const hadActiveKey = !!user.providerKeys[user.activeProvider];
    user.providerKeys[provider] = encryptApiKey(apiKey);
    if (!hadActiveKey) user.activeProvider = provider;
    await user.save();

    res.json({
      success: true,
      data: { provider, configured: true, masked: maskApiKey(apiKey) }
    });
  } catch (error) {
    next(error);
  }
};

const deleteProviderKey = async (req, res, next) => {
  try {
    const { provider } = req.params;
    assertProvider(provider);

    const user = await User.findById(req.user._id).select('+providerKeys activeProvider');
    user.providerKeys = user.providerKeys || {};
    user.providerKeys[provider] = null;
    if (user.activeProvider === provider) user.activeProvider = 'gemini';
    await user.save();

    res.json({ success: true, data: { provider, configured: false } });
  } catch (error) {
    next(error);
  }
};

const setActiveProvider = async (req, res, next) => {
  try {
    const { provider } = req.body;
    assertProvider(provider);

    const user = await User.findById(req.user._id).select('+providerKeys activeProvider');
    if (!user.providerKeys?.[provider] && !process.env[{
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      gemini: 'GEMINI_API_KEY'
    }[provider]]) {
      const error = new Error(`Configure a ${provider} key before selecting it`);
      error.status = 400;
      throw error;
    }

    user.activeProvider = provider;
    await user.save();
    res.json({ success: true, data: { activeProvider: provider } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProviderSettings, saveProviderKey, deleteProviderKey, setActiveProvider };
