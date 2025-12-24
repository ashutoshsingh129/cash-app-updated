const crypto = require('crypto');

// Hardcoded encryption key (64-character hex string = 32 bytes)
// This key is used for AES-256-CBC encryption/decryption of sensitive data
const ENCRYPTION_KEY_HEX = 'ed0f497f55636b615f08052014a98867b8acb8d601806f49f2bd6733eaabbae3';
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');

const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const combined = iv.toString('hex') + ':' + encrypted;
    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

const decrypt = (encryptedData) => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

const validateStripeKey = (key, type) => {
  if (!key || typeof key !== 'string') {
    return false;
  }

  const trimmedKey = key.trim();

  if (type === 'secret') {
    return trimmedKey.startsWith('sk_test_') || trimmedKey.startsWith('sk_live_');
  } else if (type === 'publishable') {
    return trimmedKey.startsWith('pk_test_') || trimmedKey.startsWith('pk_live_');
  }

  return false;
};

const validateStripeKeysWithAPI = async (secretKey, publishableKey) => {
  try {
    const stripe = require('stripe')(secretKey);
    const account = await stripe.accounts.retrieve();

    if (account && account.id) {
      return {
        isValid: true,
        accountId: account.id,
        accountType: account.type,
        country: account.country,
        message: 'Keys are valid and account is accessible'
      };
    } else {
      return {
        isValid: false,
        error: 'Account not accessible with provided keys',
        message: 'The provided keys do not have access to a valid Stripe account'
      };
    }
  } catch (error) {
    console.error('Stripe API validation error:', error);

    if (error.type === 'StripeAuthenticationError') {
      return {
        isValid: false,
        error: 'Authentication failed',
        message: 'Invalid secret key. Please check your Stripe secret key.'
      };
    } else if (error.type === 'StripePermissionError') {
      return {
        isValid: false,
        error: 'Permission denied',
        message: 'The provided keys do not have sufficient permissions.'
      };
    } else if (error.type === 'StripeAPIError') {
      return {
        isValid: false,
        error: 'API error',
        message: 'Stripe API error: ' + error.message
      };
    } else {
      return {
        isValid: false,
        error: 'Validation failed',
        message: 'Unable to validate keys: ' + error.message
      };
    }
  }
};

module.exports = {
  encrypt,
  decrypt,
  validateStripeKey,
  validateStripeKeysWithAPI,
};

