// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

import { useAuthStore } from './store';

describe('Zustand Auth Store', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('should handle login and save to localStorage', () => {
    const token = 'test-token';
    const user = { uuid: 'u1', name: 'User 1', email: 'user@test.com', role: 'ADMIN' };
    const company = { uuid: 'c1', name: 'Company 1' };

    useAuthStore.getState().login(token, user, company);

    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.user).toEqual(user);
    expect(state.company).toEqual(company);
    expect(state.isAuthenticated).toBe(true);

    expect(window.localStorage.getItem('erp_token')).toBe(token);
    expect(JSON.parse(window.localStorage.getItem('erp_user')!)).toEqual(user);
    expect(JSON.parse(window.localStorage.getItem('erp_company')!)).toEqual(company);
  });

  it('should handle logout and clear localStorage', () => {
    const token = 'test-token';
    const user = { uuid: 'u1', name: 'User 1', email: 'user@test.com', role: 'ADMIN' };
    const company = { uuid: 'c1', name: 'Company 1' };

    useAuthStore.getState().login(token, user, company);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.company).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(window.localStorage.getItem('erp_token')).toBeNull();
  });
});
