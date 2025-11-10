import axios from 'axios';

// Auto-detect API URL
const getAPIUrl = () => {
  // Production: use environment variable
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development: use localhost
  return 'http://localhost:5000/api';
};

const API_URL = getAPIUrl();

console.log('🔗 API URL:', API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
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

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for network errors
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      console.warn('⚠️  Network error, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(originalRequest);
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
  // Generate new QR code
  generate: async (originalUrl, createdBy = 'anonymous', customization = {}, logo = null) => {
    try {
      const response = await api.post('/qr/generate', {
        originalUrl,
        createdBy,
        customization,
        logo
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
      ...response.data 
    };
  } catch (error) {
    return { 
      status: 'ERROR', 
      error: error.message,
      details: error.response?.data 
    };
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const health = await healthCheck();
    return health.status === 'OK';
  } catch (error) {
    return false;
  }
};

export default api;