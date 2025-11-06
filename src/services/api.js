import axios from 'axios';

// Auto-detect if running on network or localhost
const getAPIUrl = () => {
  // Check if there's an environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // If accessing from network IP, use that IP for API
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5000/api`;
  }
  
  // Default to localhost
  return 'http://localhost:5000/api';
};

const API_URL = getAPIUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// QR Code API functions
export const qrAPI = {
  // Generate new QR code
  generate: async (originalUrl, createdBy = 'anonymous') => {
    const response = await api.post('/qr/generate', {
      originalUrl,
      createdBy,
    });
    return response.data;
  },

  // Get all QR codes
  list: async (params = {}) => {
    const { limit = 50, page = 1, sortBy = 'createdAt', order = 'desc' } = params;
    const response = await api.get('/qr/list', {
      params: { limit, page, sortBy, order },
    });
    return response.data;
  },

  // Get single QR code by ID
  getById: async (id) => {
    const response = await api.get(`/qr/${id}`);
    return response.data;
  },

  // Delete QR code
  delete: async (id) => {
    const response = await api.delete(`/qr/${id}`);
    return response.data;
  },

  // Get QR code statistics
  getStats: async (id) => {
    const response = await api.get(`/qr/stats/${id}`);
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
};

export default api;