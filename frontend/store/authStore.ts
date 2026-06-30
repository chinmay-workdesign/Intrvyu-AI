import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    localStorage.setItem('intrvyu_token', token);
    localStorage.setItem('intrvyu_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('intrvyu_token');
    localStorage.removeItem('intrvyu_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  hydrate: () => {
    try {
      const token = localStorage.getItem('intrvyu_token');
      const userStr = localStorage.getItem('intrvyu_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      console.error('Failed to hydrate auth store', e);
    }
  }
}));
