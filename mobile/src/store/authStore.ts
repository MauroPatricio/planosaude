import { create } from 'zustand';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | 'pending_correction';
  tenantId?: string;
  clientId?: string;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  refreshUser: () => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user: User, token: string) => {
    set({ user, token, isAuthenticated: true });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  refreshUser: async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      const user = response.data;
      set({ user });
      return user;
    } catch (error) {
      console.error('Error refreshing user status:', error);
      throw error;
    }
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    delete axios.defaults.headers.common['Authorization'];
  },
}));
