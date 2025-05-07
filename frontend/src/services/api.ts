import axios from 'axios';

// Create axios instance with base URL and default headers
const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token in headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: async (username: string, password: string) => {
    const response = await API.post('/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Risk assessment services
export const riskService = {
  assessRisk: async (data: { location: string; crop: string; scenario: string }) => {
    try {
      const response = await API.post('/risk-assessment', data);
      return response.data;
    } catch (error) {
      console.error('Error assessing risk:', error);
      throw error;
    }
  },
  getModelInfo: async () => {
    try {
      const response = await API.get('/model-info');
      return response.data;
    } catch (error) {
      console.error('Error getting model info:', error);
      throw error;
    }
  }
};

export default API;
