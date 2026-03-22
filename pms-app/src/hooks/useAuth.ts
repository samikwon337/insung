'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange } from '@/lib/auth';
import { getUser } from '@/lib/firestore';
import type { User } from '@/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
}

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    userProfile: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const profile = await getUser(fbUser.uid);
        setState({ firebaseUser: fbUser, userProfile: profile, loading: false });
      } else {
        setState({ firebaseUser: null, userProfile: null, loading: false });
      }
    });
    return unsubscribe;
  }, []);

  return state;
}
