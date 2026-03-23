'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireHrAdmin?: boolean;  // true면 isHrAdmin 사용자도 접근 가능
}

function canAccess(
  profile: { role: UserRole; isHrAdmin?: boolean } | null,
  allowedRoles?: UserRole[],
  requireHrAdmin?: boolean,
): boolean {
  if (!profile) return false;
  if (!allowedRoles && !requireHrAdmin) return true;
  const roleOk = !!allowedRoles && allowedRoles.includes(profile.role);
  const hrOk = !!requireHrAdmin && !!profile.isHrAdmin;
  return roleOk || hrOk;
}

export default function AuthGuard({ children, allowedRoles, requireHrAdmin }: AuthGuardProps) {
  const { firebaseUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    if ((allowedRoles || requireHrAdmin) && userProfile && !canAccess(userProfile, allowedRoles, requireHrAdmin)) {
      router.replace('/dashboard');
    }
  }, [firebaseUser, userProfile, loading, allowedRoles, requireHrAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!firebaseUser) return null;

  if ((allowedRoles || requireHrAdmin) && userProfile && !canAccess(userProfile, allowedRoles, requireHrAdmin)) {
    return null;
  }

  return <>{children}</>;
}
