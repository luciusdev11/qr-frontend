import axios from 'axios';
import backendFailover from './backendFailover';

// Use failover system for API URL
const getAPIUrl = () => {
  return backendFailover.getCurrentURL();
};

console.log('🔗 Initial API URL:', getAPIUrl());

// Listen for backend changes
window.addEventListener('backend-changed', (event) => {
  console.log(`🔄 Backend switched to: ${event.detail.backend}`);
});

window.addEventListener('backends-down', () => {
  console.error('❌ All backends are down!');
});

// Create axios instance with dynamic base URL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true
});

// Request interceptor - use current backend URL
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

// Response interceptor with automatic retry on different backend
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If request failed and hasn't been retried yet
    if (!originalRequest._retry && error.code === 'ECONNABORTED' || !error.response) {
      originalRequest._retry = true;
      
      console.warn('⚠️  Request failed, trying failover backend...');

      try {
        // Use failover system to try next backend
        const endpoint = originalRequest.url.replace(originalRequest.baseURL, '');
        const result = await backendFailover.makeRequest(endpoint, {
          method: originalRequest.method,
          headers: originalRequest.headers,
          body: originalRequest.data ? JSON.stringify(originalRequest.data) : undefined
        });

        return { data: result };
      } catch (failoverError) {
        console.error('❌ All backends failed:', failoverError);
        return Promise.reject(failoverError);
      }
    }

    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    return Promise.reject(error);
  }
);

// QR Code API functions
export const qrAPI = {
  // Generate new QR code (client-side rendering)
  generate: async (originalUrl, createdBy = 'anonymous', customization = {}, qrCodeImage = null) => {
    try {
      const response = await api.post('/qr/generate', {
        originalUrl,
        createdBy,
        customization,
        qrCodeImage // Send pre-generated image from client
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate QR code');
    }
  },

  // Get all QR codes with pagination
  list: async (params = {}) => {
    try {
      const { limit = 100, page = 1, sortBy = 'createdAt', order = 'desc' } = params;
      const response = await api.get('/qr/list', {
        params: { limit, page, sortBy, order },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR codes');
    }
  },

  // Get single QR code by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/qr/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch QR code');
    }
  },

  // Delete QR code
  delete: async (id) => {
    try {
      const response = await api.delete(`/qr/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete QR code');
    }
  },

  // Get QR code statistics
  getStats: async (id) => {
    try {
      const response = await api.get(`/qr/stats/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch statistics');
    }
  },
};

// Health check with detailed info
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return { 
      status: 'OK', 
      ...response.data,
      backend: backendFailover.getCurrentBackend().name
    };
  } catch (error) {
    return { 
      status: 'ERROR', 
      error: error.message,
      details: error.response?.data 
    };
  }
};

// Get backend status
export const getBackendStatus = () => {
  return backendFailover.getStatus();
};

// Force backend switch
export const switchBackend = async (backendName) => {
  return await backendFailover.switchBackend(backendName);
};

export default api