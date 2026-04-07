import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to automatically add the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the error is 401 (Unauthorized), it means the token is invalid or expired
    if (error.response && error.response.status === 401) {
      const { logout } = useAuthStore.getState();
      
      // Capture the current path to redirect back after login if needed
      const currentPath = window.location.pathname;
      
      // Don't redirect if we are already on the login page to avoid loops
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.warn('Session expired or invalid token. Redirecting to login...');
        logout();
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
