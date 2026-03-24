'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange } from '@/lib/auth';
import { getUser, updateUser } from '@/lib/firestore';
import type { User } from '@/types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        const profile = await getUser(fbUser.uid);
        // 레거시 호환: role이 'HR_ADMIN'인 경우 → TEAM_LEAD + isHrAdmin: true로 변환
        if (profile && (profile.role as string) === 'HR_ADMIN') {
          profile.role = 'TEAM_LEAD';
          profile.isHrAdmin = true;
          // Firestore 문서도 업데이트 (isOwner 권한으로 본인 문서는 항상 쓸 수 있음)
          await updateUser(fbUser.uid, { role: 'TEAM_LEAD', isHrAdmin: true });
        }
        setFirebaseUser(fbUser);
        setUserProfile(profile);
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
