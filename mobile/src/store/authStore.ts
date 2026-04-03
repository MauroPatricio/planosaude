import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
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
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    delete axios.defaults.headers.common['Authorization'];
  },
}));
