import axios from 'axios';
import backendFailover from './backendFailover';

// -------------------------
// Helpers
// -------------------------

// Get current API URL
const getAPIUrl = () => backendFailover.getCurrentURL();

console.log('🔗 Initial API URL:', getAPIUrl());

// Listen for backend changes
window.addEventListener('backend-changed', (event) => {
  console.log(`🔄 Backend switched to: ${event.detail.backend}`);
});

window.addEventListener('backends-down', () => {
  console.error('❌ All backends are down!');
});

// -------------------------
// Axios instance
// -------------------------
const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// -------------------------
// Request interceptor
// -------------------------
api.interceptors.request.use(
  (config) => {
    config.baseURL = getAPIUrl();
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// -------------------------
// Response interceptor with failover
// -------------------------
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry once if ECONNABORTED or no response
    if (!originalRequest._retry && (error.code === 'ECONNABORTED' || !error.response)) {
      originalRequest._retry = true;
      console.warn('⚠️ Request failed, trying failover backend...');

      try {
        const endpoint = originalRequest.url.replace(originalRequest.baseURL, '');
        const result = await backendFailover.makeRequest(endpoint, {
          method: originalRequest.method,
          headers: originalRequest.headers,
          body: originalRequest.data ? JSON.stringify(originalRequest.data) : undefined,
        });

        // Return failover result as Axios-like response
        return {
          data: result,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest,
          request: originalRequest,
        };
      } catch (failoverError) {
        console.error('❌ All backends failed:', failoverError);
        return Promise.reject(failoverError);
      }
    }

    console.error('❌ API Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });

    return Promise.reject(error);
  }
);

// -------------------------
// QR Code API functions
// -------------------------
export const qrAPI = {
  generate: async (originalUrl, createdBy = 'anonymous', customization = {}, qrCodeImage = null) => {
    try {
      const response = await api.post('/qr/generate', {
        originalUrl,
        createdBy,
        customization,
        qrCodeImage,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate QR code');
    }
  },

  list: async (params = {}) => {
    try {
      const { limit = 100, page = 1, sortBy = 'createdAt', order = 'desc' } = params;
      const response = await api.get('/qr/list', { params: { limit, page, sortBy, order } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR codes');
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/qr/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR code');
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/qr/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete QR code');
    }
  },

  getStats: async (id) => {
    try {
      const response = await api.get(`/qr/stats/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  },
};

// -------------------------
// Health & backend utilities
// -------------------------
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return {
      status: 'OK',
      ...response.data,
      backend: backendFailover.getCurrentBackend().name,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
      details: error.response?.data,
    };
  }
};

export const getBackendStatus = () => backendFailover.getStatus();
export const switchBackend = async (backendName) => backendFailover.switchBackend(backendName);

export default api;