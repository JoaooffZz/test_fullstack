import { create } from 'zustand';

interface User {
  uuid: string;
  name: string;
  email: string;
  role: string;
}

interface Company {
  uuid: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  login: (token: string, user: User, company: Company) => void;
  logout: () => void;
  apiCall: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const API_BASE_URL = 'http://localhost:3001';

const getInitialState = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const token = localStorage.getItem('erp_token');
      const userJson = localStorage.getItem('erp_user');
      const companyJson = localStorage.getItem('erp_company');
      
      if (token && userJson && companyJson) {
        return {
          token,
          user: JSON.parse(userJson),
          company: JSON.parse(companyJson),
          isAuthenticated: true,
        };
      }
    }
  } catch (e) {
    console.error('Failed to load auth state from localStorage', e);
  }
  
  return {
    token: null,
    user: null,
    company: null,
    isAuthenticated: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),
  
  login: (token, user, company) => {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem('erp_token', token);
      localStorage.setItem('erp_user', JSON.stringify(user));
      localStorage.setItem('erp_company', JSON.stringify(company));
    }
    set({ token, user, company, isAuthenticated: true });
  },
  
  logout: () => {
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_company');
    }
    set({ token: null, user: null, company: null, isAuthenticated: false });
  },
  
  apiCall: async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const { token } = get();
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      // Auto logout on unauthorized
      get().logout();
      throw new Error('Não autorizado. Por favor, faça login novamente.');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na requisição');
    }
    
    return data as T;
  },
}));
