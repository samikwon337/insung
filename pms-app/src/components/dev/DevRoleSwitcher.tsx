'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithTestAccount, signOut } from '@/lib/auth';
import type { UserRole } from '@/types';

const ROLE_ACCOUNTS: { role: UserRole; label: string; email: string; color: string }[] = [
  { role: 'MEMBER',    label: '팀원',      email: 'sslee2@insungind.co.kr', color: 'bg-gray-500 hover:bg-gray-600' },
  { role: 'TEAM_LEAD', label: '팀장',      email: 'sslee3@insungind.co.kr', color: 'bg-green-600 hover:bg-green-700' },
  { role: 'EXECUTIVE', label: '임원',      email: 'sslee4@insungind.co.kr', color: 'bg-purple-600 hover:bg-purple-700' },
  { role: 'CEO',       label: '최고관리자', email: 'sslee1@insungind.co.kr', color: 'bg-blue-600 hover:bg-blue-700' },
  { role: 'HR_ADMIN',  label: 'HR관리자',  email: 'sslee@insungind.co.kr',  color: 'bg-orange-500 hover:bg-orange-600' },
];

const PASSWORD = 'Insung@1234!';
const IS_DEV = process.env.NODE_ENV === 'development';

export default function DevRoleSwitcher() {
  const { userProfile } = useAuth();
  const [switching, setSwitching] = useState<UserRole | null>(null);

  if (!IS_DEV) return null;

  async function handleSwitch(role: UserRole, email: string) {
    if (userProfile?.role === role) return;
    setSwitching(role);
    try {
      await signOut();
      await signInWithTestAccount(email, PASSWORD);
    } catch (e) {
      console.error('역할 전환 실패:', e);
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        Dev · 역할 전환
      </span>
      <div className="flex gap-1.5 rounded-xl bg-black/80 px-3 py-2 shadow-xl backdrop-blur">
        {ROLE_ACCOUNTS.map(({ role, label, email, color }) => (
          <button
            key={role}
            onClick={() => handleSwitch(role, email)}
            disabled={switching !== null}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white transition-all ${color} ${
              userProfile?.role === role ? 'ring-2 ring-white ring-offset-1 ring-offset-black/80' : 'opacity-60'
            } ${switching === role ? 'animate-pulse' : ''}`}
          >
            {switching === role ? '...' : label}
          </button>
        ))}
      </div>
    </div>
  );
}
