'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { randomGradient } from '@/lib/avatar';
import { User } from '@/lib/types';

interface UserCtx {
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  signIn: (username: string) => Promise<{ ok: boolean; error?: string }>;
  setUsername: (username: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  ensureGuestUser: () => Promise<User | null>;
}

const Ctx = createContext<UserCtx>({
  user: null,
  loading: true,
  needsOnboarding: false,
  signIn: async () => ({ ok: false }),
  setUsername: async () => ({ ok: false }),
  signOut: () => {},
  ensureGuestUser: async () => null,
});

export function useUser() {
  return useContext(Ctx);
}

const LOCAL_ID_KEY = 'echo-user-id';

function buildGuestUsername(): string {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `Guest-${suffix}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const ensureGuestUser = useCallback(async () => {
    const storedId = localStorage.getItem(LOCAL_ID_KEY);
    if (storedId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', storedId)
        .maybeSingle();

      if (data) {
        setUser(data as User);
        setNeedsOnboarding(false);
        return data as User;
      }

      localStorage.removeItem(LOCAL_ID_KEY);
    }

    const g = randomGradient();
    const { data, error } = await supabase
      .from('users')
      .insert({ username: buildGuestUsername(), avatar_color: g.color, avatar_gradient_from: g.from, avatar_gradient_to: g.to })
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    localStorage.setItem(LOCAL_ID_KEY, data.id);
    setUser(data as User);
    setNeedsOnboarding(false);
    return data as User;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const guest = await ensureGuestUser();
      if (active) {
        setLoading(false);
        if (!guest) {
          setNeedsOnboarding(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [ensureGuestUser]);

  const signIn = useCallback(async (rawName: string) => {
    const username = rawName.trim() ? rawName.trim() : buildGuestUsername();

    const g = randomGradient();
    const { data, error } = await supabase
      .from('users')
      .insert({ username, avatar_color: g.color, avatar_gradient_from: g.from, avatar_gradient_to: g.to })
      .select()
      .single();

    if (error || !data) {
      return { ok: false, error: 'Could not create profile. Try again.' };
    }

    localStorage.setItem(LOCAL_ID_KEY, data.id);
    setUser(data as User);
    setNeedsOnboarding(false);
    return { ok: true };
  }, []);

  const setUsername = useCallback(async (rawName: string) => {
    if (!user) return { ok: false, error: 'Not signed in' };
    const username = rawName.trim() ? rawName.trim() : buildGuestUsername();

    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id)
      .select()
      .single();

    if (error || !data) return { ok: false, error: 'Could not update username' };
    setUser(data as User);
    return { ok: true };
  }, [user]);

  const signOut = useCallback(() => {
    localStorage.removeItem(LOCAL_ID_KEY);
    setUser(null);
    setNeedsOnboarding(true);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, needsOnboarding, signIn, setUsername, signOut, ensureGuestUser }}>
      {children}
    </Ctx.Provider>
  );
}

export {};
