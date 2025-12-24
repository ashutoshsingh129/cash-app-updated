const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const apiService = {
  async checkKeysStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/keys/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: { hasKeys: result.hasKeys },
        message: result.message || 'Keys status checked successfully',
        success: result.success,
      };
    } catch (error) {
      return {
        data: { hasKeys: false },
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async storeStripeKeys(keys) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/keys`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(keys),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        const errorData = await response.json();
        return {
          data: null,
          message: errorData.message || 'Failed to save Stripe keys',
          success: false,
          error: errorData.error,
        };
      }

      const result = await response.json();
      return {
        data: result.data,
        message: result.message || 'Keys stored successfully',
        success: result.success,
      };
    } catch (error) {
      return {
        data: null,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async loadKeysIntoCache() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/keys/load-cache`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result.data,
        message: result.message || 'Keys loaded into cache',
        success: result.success,
      };
    } catch (error) {
      return {
        data: null,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async getSecretKey() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/keys/secret`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        if (response.status === 404) {
          return {
            data: null,
            message: 'No Stripe keys configured',
            success: false,
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        data: result.data,
        message: result.message || 'Secret key retrieved',
        success: result.success,
      };
    } catch (error) {
      return {
        data: null,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async clearStripeKeys() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/keys`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        const errorData = await response.json();
        return {
          data: null,
          message: errorData.message || 'Failed to clear Stripe keys',
          success: false,
          error: errorData.error,
        };
      }

      const result = await response.json();
      return {
        data: result.data,
        message: result.message || 'Keys cleared successfully',
        success: result.success,
      };
    } catch (error) {
      return {
        data: null,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false,
      };
    }
  },
};

