'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import {
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from './amplify';

export type AuthUser = {
  id: string;
  email?: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithEmailPassword: (username: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (username: string, password: string, email: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadUser(): Promise<AuthUser | null> {
  console.log('[loadUser] called');
  ensureAmplifyConfigured();

  try {
    const current = await getCurrentUser();
    console.log('[loadUser] getCurrentUser success:', current);
    let email: string | undefined;

    try {
      const attrs = await fetchUserAttributes();
      email = attrs.email;
      console.log('[loadUser] fetchUserAttributes success, email:', email);
    } catch (attrErr) {
      console.warn('[loadUser] fetchUserAttributes failed:', attrErr);
    }

    const result = { id: current.userId, email };
    console.log('[loadUser] returning user:', result);
    return result;
  } catch (err) {
    console.warn('[loadUser] getCurrentUser failed:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    console.log('[refreshUser] called');
    setIsLoading(true);
    try {
      const u = await loadUser();
      console.log('[refreshUser] setting user to:', u);
      setUser(u);
    } catch (err) {
      console.error('[refreshUser] error:', err);
    } finally {
      setIsLoading(false);
      console.log('[refreshUser] done, isLoading set to false');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      console.log('[AuthProvider] initial loadUser running');
      try {
        const u = await loadUser();
        console.log('[AuthProvider] initial loadUser result:', u);
        if (!cancelled) setUser(u);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          console.log('[AuthProvider] initial load complete, isLoading = false');
        }
      }
    };

    run();

    const unsubscribe = Hub.listen('auth', (data) => {
      console.log('[Hub] auth event received:', data);
      refreshUser().catch((err) => {
        console.error('[Hub] refreshUser error:', err);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [refreshUser]);

  const getIdToken = useCallback(async () => {
    console.log('[getIdToken] called');
    ensureAmplifyConfigured();
    const session = await fetchAuthSession();
    console.log('[getIdToken] session tokens present:', !!session.tokens);
    const token = session.tokens?.idToken?.toString();
    if (!token) throw new Error('User not authenticated');
    return token;
  }, []);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    console.log('[signIn] called with username:', email);
    ensureAmplifyConfigured();
    const result = await signIn({ username: email, password });
    console.log('[signIn] signIn result:', JSON.stringify(result));
    console.log('[signIn] isSignedIn:', result.isSignedIn);
    console.log('[signIn] nextStep:', JSON.stringify(result.nextStep));
    if (!result.isSignedIn) {
      const step = result.nextStep?.signInStep;
      const err = new Error(`Sign-in requires further action: ${step}`);
      (err as any).signInStep = step;
      throw err;
    }
    console.log('[signIn] waiting 300ms before refreshUser...');
    await new Promise(res => setTimeout(res, 300));
    console.log('[signIn] calling refreshUser...');
    await refreshUser();
    console.log('[signIn] refreshUser complete');
  }, [refreshUser]);

  const confirmSignUpFn = useCallback(async (username: string, code: string) => {
    console.log('[confirmSignUp] called for username:', username);
    ensureAmplifyConfigured();
    await confirmSignUp({ username, confirmationCode: code });
    console.log('[confirmSignUp] confirmed, signing in...');
  }, []);

  const signUpWithEmailPassword = useCallback(async (username: string, password: string, email: string) => {
    console.log('[signUp] called with username:', username, 'email:', email);
    ensureAmplifyConfigured();
    const result = await signUp({
      username,
      password,
      options: {
        userAttributes: { email },
        autoSignIn: true,
      },
    });
    console.log('[signUp] signUp result:', result);
    // If autoSignIn succeeds, session will exist and user will refresh.
    await refreshUser();
    console.log('[signUp] refreshUser complete');
  }, [refreshUser]);

  const signOutFn = useCallback(async () => {
    console.log('[signOut] called');
    ensureAmplifyConfigured();
    await signOut();
    setUser(null);
    console.log('[signOut] complete, user set to null');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      signInWithEmailPassword,
      signUpWithEmailPassword,
      confirmSignUp: confirmSignUpFn,
      signOut: signOutFn,
      getIdToken,
    }),
    [getIdToken, isLoading, signInWithEmailPassword, signOutFn, signUpWithEmailPassword, confirmSignUpFn, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
