class StripeKeysCache {
  constructor() {
    this.cache = new Map();
  }

  updateKeys(userId, secretKey, publishableKey) {
    try {
      this.cache.set(userId, {
        secretKey,
        publishableKey,
        lastUpdated: new Date(),
      });

      console.log(`Stripe keys cache updated successfully for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Failed to update Stripe keys cache for user ${userId}:`, error);
      return false;
    }
  }

  updateUserKeys(userId, secretKey, publishableKey) {
    return this.updateKeys(userId, secretKey, publishableKey);
  }

  getKeys(userId) {
    const userCache = this.cache.get(userId);
    if (!userCache) {
      return {
        secretKey: null,
        publishableKey: null,
        lastUpdated: null,
      };
    }
    return {
      secretKey: userCache.secretKey,
      publishableKey: userCache.publishableKey,
      lastUpdated: userCache.lastUpdated,
    };
  }

  hasValidKeys(userId) {
    const userCache = this.cache.get(userId);
    return userCache && userCache.secretKey && userCache.publishableKey;
  }

  clearUserCache(userId) {
    this.cache.delete(userId);
    console.log(`Stripe keys cache cleared for user ${userId}`);
  }

  clearCache() {
    this.cache.clear();
    console.log('All Stripe keys cache cleared');
  }

  getStatus(userId) {
    const userCache = this.cache.get(userId);
    if (!userCache) {
      return {
        hasKeys: false,
        lastUpdated: null,
        age: null,
      };
    }
    return {
      hasKeys: this.hasValidKeys(userId),
      lastUpdated: userCache.lastUpdated,
      age: userCache.lastUpdated ?
        Math.floor((new Date() - userCache.lastUpdated) / 1000) : null,
    };
  }

  getCachedUsers() {
    return Array.from(this.cache.keys());
  }
}

const stripeKeysCache = new StripeKeysCache();

module.exports = stripeKeysCache;

