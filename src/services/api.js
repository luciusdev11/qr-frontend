import axios from 'axios';
import serverSelector from './serverSelector';

// Use server selector for API URL
const getAPIUrl = () => {
  return serverSelector.getCurrentURL();
};

console.log('🔗 Initial API URL:', getAPIUrl());

// Listen for server changes
window.addEventListener('server-changed', (event) => {
  console.log(`🔄 Switched to: ${event.detail.server.name}`);
  console.log(`📍 URL: ${event.detail.server.url}`);
});

// Create axios instance with dynamic base URL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true
});

// Request interceptor - use current server URL
api.interceptors.request.use(
  (config) => {
    config.baseURL = getAPIUrl();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
      console.log(`🌐 Server: ${serverSelector.getCurrentServer().name}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.data);
    }
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      server: serverSelector.getCurrentServer().name
    });

    return Promise.reject(error);
  }
);

// QR Code API functions
export const qrAPI = {
  // Generate new QR code
  generate: async (originalUrl, createdBy = 'anonymous', customization = {}) => {
    try {
      const response = await api.post('/qr/generate', {
        originalUrl,
        createdBy,
        customization
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
      server: serverSelector.getCurrentServer()
    };
  } catch (error) {
    return { 
      status: 'ERROR', 
      error: error.message,
      details: error.response?.data,
      server: serverSelector.getCurrentServer()
    };
  }
};

// Get all servers with status
export const getServers = () => {
  return serverSelector.getServers();
};

// Switch server
export const switchServer = (serverKey) => {
  return serverSelector.switchServer(serverKey);
};

// Check server health
export const checkServerHealth = (serverKey) => {
  return serverSelector.checkServerHealth(serverKey);
};

export default api;