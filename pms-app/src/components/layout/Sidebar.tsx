'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  Building2,
  CheckSquare,
  Star,
  Flag,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  // ── 전체 공통 ──────────────────────────────────
  {
    label: '대시보드',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  // ── 팀원 / 팀장 전용 ────────────────────────────
  {
    label: '내 목표',
    href: '/goals',
    icon: <Target className="h-5 w-5" />,
    roles: ['MEMBER', 'TEAM_LEAD', 'HR_ADMIN'],
  },
  // ── 진행현황 (팀원/팀장/HR만 — 임원·CEO는 대시보드가 진행현황) ─
  {
    label: '진행 현황',
    href: '/progress',
    icon: <TrendingUp className="h-5 w-5" />,
    roles: ['MEMBER', 'TEAM_LEAD', 'HR_ADMIN'],
  },
  // ── 1on1 (팀원·팀장·임원) ──────────────────────
  {
    label: '1on1',
    href: '/oneon1',
    icon: <Users className="h-5 w-5" />,
    roles: ['MEMBER', 'TEAM_LEAD', 'EXECUTIVE'],
  },
  // ── 승인 대기함 (팀장·임원) ────────────────────
  {
    label: '승인 대기함',
    href: '/approvals',
    icon: <CheckSquare className="h-5 w-5" />,
    roles: ['TEAM_LEAD', 'EXECUTIVE'],
  },
  // ── 평가 관리 ──────────────────────────────────
  {
    label: '평가 관리',
    href: '/evaluation',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['MEMBER', 'TEAM_LEAD', 'EXECUTIVE'],
  },
  // ── CEO / HR관리자 공통 ────────────────────────
  {
    label: '조직평가 관리',
    href: '/evaluation/org',
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ['CEO', 'HR_ADMIN'],
  },
  // ── HR관리자 전용 ──────────────────────────────
  {
    label: '사용자 관리',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    roles: ['HR_ADMIN'],
  },
  {
    label: '조직 관리',
    href: '/admin/organizations',
    icon: <Building2 className="h-5 w-5" />,
    roles: ['HR_ADMIN'],
  },
  {
    label: '연간 목표 관리',
    href: '/admin/annual-goals',
    icon: <Flag className="h-5 w-5" />,
    roles: ['HR_ADMIN'],
  },
  {
    label: '마일리지 관리',
    href: '/admin/mileage',
    icon: <Star className="h-5 w-5" />,
    roles: ['HR_ADMIN', 'CEO'],
  },
  {
    label: '시스템 설정',
    href: '/admin/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: ['HR_ADMIN'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || (userProfile && item.roles.includes(userProfile.role))
  );

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      {/* 로고 */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          P
        </div>
        <span className="text-sm font-semibold text-gray-900">INSUNG</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단: 역할 배지 + 로그아웃 */}
      {userProfile && (
        <div className="border-t border-gray-200 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-900">{userProfile.name}</p>
              <RoleBadge role={userProfile.role} />
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const labels: Record<UserRole, { label: string; color: string }> = {
    MEMBER: { label: '팀원', color: 'bg-gray-100 text-gray-700' },
    TEAM_LEAD: { label: '팀장', color: 'bg-green-100 text-green-700' },
    EXECUTIVE: { label: '임원', color: 'bg-purple-100 text-purple-700' },
    CEO: { label: '최고관리자', color: 'bg-blue-100 text-blue-700' },
    HR_ADMIN: { label: 'HR관리자', color: 'bg-orange-100 text-orange-700' },
  };
  const { label, color } = labels[role];
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', color)}>
      {label}
    </span>
  );
}
