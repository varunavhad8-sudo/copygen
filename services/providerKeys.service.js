const crypto = require('crypto');

const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'gemini'];

const getEncryptionKey = () => {
  const configured = process.env.PROVIDER_KEYS_ENCRYPTION_KEY || process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  const secret = configured || 'copygen-development-provider-key-change-me';

  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('PROVIDER_KEYS_ENCRYPTION_KEY must be configured in production');
  }

  return crypto.createHash('sha256').update(secret).digest();
};

const assertProvider = (provider) => {
  if (!ALLOWED_PROVIDERS.includes(provider)) {
    const error = new Error(`Unsupported AI provider: ${provider}`);
    error.status = 400;
    throw error;
  }
};

const encryptApiKey = (value) => {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
};

const decryptApiKey = (value) => {
  if (!value) return null;
  if (!value.startsWith('v1.')) throw new Error('Unsupported provider key format');

  const [, ivEncoded, tagEncoded, ciphertextEncoded] = value.split('.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivEncoded, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextEncoded, 'base64url')),
    decipher.final()
  ]).toString('utf8');
};

const maskApiKey = (value) => {
  if (!value) return null;
  if (value.length <= 10) return `${value.slice(0, 3)}...`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const getEnvironmentKey = (provider) => ({
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  gemini: process.env.GEMINI_API_KEY
}[provider] || null);

const getUserProviderKeys = async (userId) => {
  const User = require('../models/User');
  const user = await User.findById(userId).select('+providerKeys activeProvider').lean();
  const encrypted = user?.providerKeys || {};
  const keys = {};

  for (const provider of ALLOWED_PROVIDERS) {
    const encryptedKey = encrypted[provider];
    keys[provider] = encryptedKey ? decryptApiKey(encryptedKey) : null;
  }

  return {
    activeProvider: user?.activeProvider || 'gemini',
    keys
  };
};

const getEffectiveProviderKeys = async (userId) => {
  const userConfig = userId ? await getUserProviderKeys(userId) : { activeProvider: 'gemini', keys: {} };
  const keys = {};

  for (const provider of ALLOWED_PROVIDERS) {
    keys[provider] = userConfig.keys[provider] || getEnvironmentKey(provider);
  }

  return { activeProvider: userConfig.activeProvider, keys };
};

module.exports = {
  ALLOWED_PROVIDERS,
  assertProvider,
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  getEnvironmentKey,
  getUserProviderKeys,
  getEffectiveProviderKeys
};
