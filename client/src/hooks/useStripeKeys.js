import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function useStripeKeys() {
  const { user } = useAuth();
  const [stripeSecretKey, setStripeSecretKey] = useState(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadKeysFromServer = async () => {
    if (!user || !user.id) {
      setLoading(false);
      setStripeSecretKey(null);
      setHasKeys(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const statusResult = await apiService.checkKeysStatus();
      if (statusResult.success && statusResult.data.hasKeys) {
        setHasKeys(true);
        const keyResult = await apiService.getSecretKey();
        if (keyResult.success && keyResult.data && keyResult.data.secretKey) {
          setStripeSecretKey(keyResult.data.secretKey);
        } else {
          setError(keyResult.message || 'Failed to load secret key');
          setStripeSecretKey(null);
        }
      } else {
        setHasKeys(false);
        setStripeSecretKey(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load keys');
      setHasKeys(false);
      setStripeSecretKey(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeysFromServer();
  }, [user]);

  const refreshKeys = () => {
    loadKeysFromServer();
  };

  return {
    stripeSecretKey,
    hasKeys,
    loading,
    error,
    refreshKeys,
  };
}

