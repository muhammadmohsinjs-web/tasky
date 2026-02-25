import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  user: User | null;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshGoogleToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: true,
  user: null,
  googleAccessToken: null,
  googleRefreshToken: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshGoogleToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(null);
  const appBaseUrl = window.location.origin;
  const googleScopes = ['openid', 'email', 'profile'].join(' ');

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const accessToken = session?.provider_token ?? null;
      const refreshToken = session?.provider_refresh_token ?? null;
      if (accessToken) setGoogleAccessToken(accessToken);
      if (refreshToken) setGoogleRefreshToken(refreshToken);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Capture Google provider token whenever it's available (e.g. right after OAuth sign-in)
      const accessToken = session?.provider_token ?? null;
      const refreshToken = session?.provider_refresh_token ?? null;
      if (accessToken) setGoogleAccessToken(accessToken);
      if (refreshToken) setGoogleRefreshToken(refreshToken);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appBaseUrl}/dashboard`,
        scopes: googleScopes,
      },
    });
  };

  const clearAuthState = useCallback(() => {
    setUser(null);
    setGoogleAccessToken(null);
    setGoogleRefreshToken(null);
  }, []);

  const isSessionMissingSignOutError = (error: unknown) => {
    const message = typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
    return message.toLowerCase().includes('session') && message.toLowerCase().includes('missing');
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        if (isSessionMissingSignOutError(error)) {
          clearAuthState();
          return;
        }
        console.error('Sign out failed:', error);
        toast.error('Failed to sign out');
        return;
      }
      clearAuthState();
    } catch (err) {
      if (isSessionMissingSignOutError(err)) {
        clearAuthState();
        return;
      }
      console.error('Sign out failed:', err);
      toast.error('Failed to sign out');
    }
  };

  const refreshGoogleToken = useCallback(async (): Promise<string | null> => {
    // If we already have a token in memory, return it.
    // It may be expired (Google tokens last ~1 hour), but Google will
    // return a 401 in that case which the caller can handle.
    if (googleAccessToken) return googleAccessToken;

    // Try to get it from the current session (available right after OAuth)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.provider_token) {
      setGoogleAccessToken(session.provider_token);
      return session.provider_token;
    }

    return null;
  }, [googleAccessToken]);

  return <AuthContext.Provider value={{ authenticated: !!user, loading, user, googleAccessToken, googleRefreshToken, signInWithGoogle, signOut, refreshGoogleToken }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
