const express = require('express');
const { pool } = require('../config/database');
const stripeKeysCache = require('../utils/stripeKeysCache');
const { encrypt, decrypt, validateStripeKey, validateStripeKeysWithAPI } = require('../utils/encryption');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/keys', async (req, res) => {
  try {
    const { secret_key, publishable_key } = req.body;
    const userId = req.user.id;

    if (!secret_key || !publishable_key) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both secret_key and publishable_key are required',
      });
    }

    if (!validateStripeKey(secret_key, 'secret')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid secret key format',
        message: 'Secret key must start with sk_test_ or sk_live_',
      });
    }

    if (!validateStripeKey(publishable_key, 'publishable')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid publishable key format',
        message: 'Publishable key must start with pk_test_ or pk_live_',
      });
    }

    const validationResult = await validateStripeKeysWithAPI(secret_key.trim(), publishable_key.trim());

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error || 'Invalid keys',
        message: validationResult.message || 'The provided Stripe keys are invalid or not accessible',
      });
    }

    const encryptedSecretKey = encrypt(secret_key.trim());

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE stripe_keys SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const result = await client.query(
        'INSERT INTO stripe_keys (user_id, secret_key, publishable_key) VALUES ($1, $2, $3) RETURNING id, created_at',
        [userId, encryptedSecretKey, publishable_key.trim()]
      );

      await client.query('COMMIT');

      const cacheUpdated = stripeKeysCache.updateKeys(userId, secret_key.trim(), publishable_key.trim());

      if (!cacheUpdated) {
        console.warn('Failed to update cache, but keys were saved to database');
      }

      res.json({
        success: true,
        message: 'Stripe keys saved successfully',
        data: {
          id: result.rows[0].id,
          created_at: result.rows[0].created_at,
          cache_updated: cacheUpdated,
          validation: {
            account_id: validationResult.accountId,
            account_type: validationResult.accountType,
            country: validationResult.country,
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving Stripe keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save Stripe keys',
      message: error.message,
    });
  }
});

router.get('/keys/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM stripe_keys WHERE user_id = $1 AND is_active = true',
        [userId]
      );

      const hasKeys = parseInt(result.rows[0].count) > 0;

      res.json({
        success: true,
        hasKeys,
        message: hasKeys ? 'Keys are configured for this user' : 'No keys configured for this user',
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking keys status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check keys status',
      message: error.message,
    });
  }
});

router.post('/keys/load-cache', async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT secret_key, publishable_key FROM stripe_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No active Stripe keys found for this user',
          message: 'No keys available to load into cache',
        });
      }

      const { secret_key: encryptedSecretKey, publishable_key } = result.rows[0];
      let decryptedSecretKey;
      try {
        decryptedSecretKey = decrypt(encryptedSecretKey);
      } catch (decryptError) {
        console.error('Failed to decrypt secret key:', decryptError.message);
        return res.status(500).json({
          success: false,
          error: 'Decryption failed',
          message: 'Failed to decrypt stored keys. This may happen if ENCRYPTION_KEY environment variable was not set consistently. Please re-enter your keys.',
        });
      }
      const cacheUpdated = stripeKeysCache.updateKeys(userId, decryptedSecretKey, publishable_key);

      res.json({
        success: true,
        message: cacheUpdated ? 'Cache updated successfully' : 'Failed to update cache',
        data: {
          cache_updated: cacheUpdated,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error loading keys into cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load keys into cache',
      message: error.message,
    });
  }
});

const ensureKeysInCache = async (userId) => {
  const keys = stripeKeysCache.getKeys(userId);
  if (keys.secretKey) return keys;

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT secret_key, publishable_key FROM stripe_keys WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (result.rows.length === 0) {
        return { secretKey: null };
      }
      try {
        const decryptedSecretKey = decrypt(result.rows[0].secret_key);
        stripeKeysCache.updateKeys(userId, decryptedSecretKey, result.rows[0].publishable_key);
        return { secretKey: decryptedSecretKey };
      } catch (decryptError) {
        console.warn(`Failed to decrypt keys for user ${userId}. Keys may have been encrypted with a different key.`);
        // Mark these keys as inactive so they don't keep failing
        await client.query('UPDATE stripe_keys SET is_active = false WHERE user_id = $1 AND is_active = true', [userId]);
        return { secretKey: null };
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Error ensuring keys in cache:', e.message);
    return { secretKey: null };
  }
};

router.get('/keys/secret', async (req, res) => {
  try {
    const userId = req.user.id;
    const keys = await ensureKeysInCache(userId);

    if (!keys.secretKey) {
      return res.status(404).json({
        success: false,
        error: 'No Stripe keys found',
        message: 'Please configure your Stripe keys first',
      });
    }

    res.json({
      success: true,
      data: {
        secretKey: keys.secretKey,
      },
    });
  } catch (error) {
    console.error('Error getting secret key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get secret key',
      message: error.message,
    });
  }
});

router.delete('/keys', async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query('DELETE FROM stripe_keys WHERE user_id = $1', [userId]);
      await client.query('COMMIT');
      stripeKeysCache.clearUserCache(userId);

      res.json({
        success: true,
        message: 'Stripe keys cleared successfully for this user',
        data: {
          deleted_count: result.rowCount,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error clearing Stripe keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear Stripe keys',
      message: error.message,
    });
  }
});

module.exports = router;

