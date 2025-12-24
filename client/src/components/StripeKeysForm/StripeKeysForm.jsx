import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Save, Security } from '@mui/icons-material';
import { StripeKeysFormStyles } from './StripeKeysForm.styles';
import { apiService } from '../../services/api';

const StripeKeysForm = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    secretKey: '',
    publishableKey: '',
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const toggleSecretKeyVisibility = () => {
    setShowSecretKey(prev => !prev);
  };

  const validateForm = () => {
    if (!formData.secretKey.trim()) {
      setError('Secret key is required');
      return false;
    }
    if (!formData.publishableKey.trim()) {
      setError('Publishable key is required');
      return false;
    }

    if (!formData.secretKey.startsWith('sk_')) {
      setError('Secret key must start with "sk_"');
      return false;
    }
    if (!formData.publishableKey.startsWith('pk_')) {
      setError('Publishable key must start with "pk_"');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.storeStripeKeys({
        secret_key: formData.secretKey.trim(),
        publishable_key: formData.publishableKey.trim(),
      });

      if (result.success) {
        setSuccess('Stripe keys saved successfully! All future API calls will use these keys.');
        setFormData({ secretKey: '', publishableKey: '' });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        let errorMessage = result.message || 'Failed to save Stripe keys';

        if (result.error === 'Authentication failed') {
          errorMessage = 'Invalid secret key. Please check your Stripe secret key.';
        } else if (result.error === 'Permission denied') {
          errorMessage = 'The provided keys do not have sufficient permissions.';
        } else if (result.error === 'API error') {
          errorMessage = 'Stripe API error. Please try again later.';
        } else if (result.error === 'Invalid secret key format') {
          errorMessage = 'Secret key must start with sk_test_ or sk_live_';
        } else if (result.error === 'Invalid publishable key format') {
          errorMessage = 'Publishable key must start with pk_test_ or pk_live_';
        }

        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StripeKeysFormStyles>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" marginBottom={3}>
            <Security color="primary" sx={{ marginRight: 1 }} />
            <Typography variant="h5" component="h2">
              Configure Stripe Keys
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" marginBottom={3}>
            Enter your Stripe API keys to configure the system. Secret keys are encrypted
            using AES-256-CBC before storage. HTTPS ensures data is encrypted in transit.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ marginBottom: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Secret Key"
              type={showSecretKey ? 'text' : 'password'}
              value={formData.secretKey}
              onChange={handleInputChange('secretKey')}
              placeholder="sk_test_..."
              disabled={loading}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle secret key visibility"
                      onClick={toggleSecretKeyVisibility}
                      edge="end"
                      disabled={loading}
                    >
                      {showSecretKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Your Stripe secret key (starts with sk_)"
            />

            <TextField
              fullWidth
              label="Publishable Key"
              type="text"
              value={formData.publishableKey}
              onChange={handleInputChange('publishableKey')}
              placeholder="pk_test_..."
              disabled={loading}
              margin="normal"
              helperText="Your Stripe publishable key (starts with pk_)"
            />

            <Box display="flex" justifyContent="flex-end" marginTop={3}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                disabled={
                  loading ||
                  !formData.secretKey.trim() ||
                  !formData.publishableKey.trim()
                }
                size="large"
              >
                {loading ? 'Saving...' : 'Save Keys'}
              </Button>
            </Box>
          </Box>

          <Box marginTop={3}>
            <Typography variant="caption" color="text.secondary">
              <strong>Security Note:</strong> Secret keys are encrypted using AES-256-CBC
              with a server-side encryption key before being stored in the database. HTTPS
              ensures data is encrypted in transit. Keys are cached in memory for optimal
              performance.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </StripeKeysFormStyles>
  );
};

export default StripeKeysForm;

