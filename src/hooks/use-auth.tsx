"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Persist authentication state across reloads
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    setIsAuthenticated(!!userId);
  }, []);

  const login = useCallback(async (pin: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .single();

    if (data && !error) {
      localStorage.setItem('user_id', data.id);
      setIsAuthenticated(true);
      router.push('/dashboard');
      setIsLoading(false);
      return true;
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  return { isAuthenticated, isLoading, login, logout };
}
