const crypto = require('crypto');

// Get encryption key from environment or use a default (for development)
// In production, ALWAYS set PASSWORD_ENCRYPTION_KEY in your .env file
const getPasswordEncryptionKey = () => {
  const envKey = process.env.PASSWORD_ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      return Buffer.from(envKey, 'hex');
    }
    return Buffer.from(envKey, 'utf8').slice(0, 32);
  }

  // Default key for development (32 bytes)
  // WARNING: Change this in production!
  const defaultKey = 'cashapp-pay-password-encryption-key-32bytes!';
  console.warn('⚠️  Using default PASSWORD_ENCRYPTION_KEY. Set PASSWORD_ENCRYPTION_KEY in .env for production!');
  return Buffer.from(defaultKey, 'utf8').slice(0, 32);
};

const PASSWORD_ENCRYPTION_KEY = getPasswordEncryptionKey();

/**
 * Encrypts a password using AES-256-CBC before hashing
 * Uses a deterministic IV (derived from password hash) so the same password
 * always encrypts to the same value, enabling bcrypt comparison to work
 * 
 * @param {string} password - Plain text password
 * @returns {string} - Encrypted password (hex format: iv:encrypted)
 */
const encryptPassword = (password) => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Generate a deterministic IV from the password using HMAC
    // This ensures the same password always produces the same encrypted value
    const hmac = crypto.createHmac('sha256', PASSWORD_ENCRYPTION_KEY);
    hmac.update(password);
    const ivBuffer = hmac.digest().slice(0, 16); // Use first 16 bytes as IV

    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv('aes-256-cbc', PASSWORD_ENCRYPTION_KEY, ivBuffer);

    // Encrypt the password
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV and encrypted data (format: iv:encrypted)
    // Note: IV is deterministic, so we don't need to store it separately
    const combined = ivBuffer.toString('hex') + ':' + encrypted;

    return combined;
  } catch (error) {
    console.error('Password encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
};

/**
 * Decrypts a password (used for verification during login)
 * Note: This is not typically used since we hash after encryption
 * 
 * @param {string} encryptedPassword - Encrypted password (format: iv:encrypted)
 * @returns {string} - Decrypted password
 */
const decryptPassword = (encryptedPassword) => {
  try {
    if (!encryptedPassword || typeof encryptedPassword !== 'string') {
      throw new Error('Encrypted password must be a non-empty string');
    }

    // Split the combined data
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }

    const ivBuffer = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher using AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', PASSWORD_ENCRYPTION_KEY, ivBuffer);

    // Decrypt the password
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Password decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
};

module.exports = {
  encryptPassword,
  decryptPassword,
};

