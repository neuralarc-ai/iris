"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_PIN, AUTH_TOKEN_KEY } from '@/lib/constants';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token === DEMO_PIN) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      // localStorage might not be available (e.g. SSR or incognito)
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (pin: string) => {
    if (pin === DEMO_PIN) {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, pin);
      } catch (error) {
        // Handle localStorage error (e.g. private browsing)
        console.warn("Could not save auth token to localStorage", error);
      }
      setIsAuthenticated(true);
      router.push('/dashboard');
      return true;
    }
    setIsAuthenticated(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
       console.warn("Could not remove auth token from localStorage", error);
    }
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  return { isAuthenticated, isLoading, login, logout };
}
