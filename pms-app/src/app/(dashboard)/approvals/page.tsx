'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckSquare, User, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPendingGoalsByOrganizations, getAllUsers, getOrganizations } from '@/lib/firestore';
import Header from '@/components/layout/Header';
import GoalStatusBadge from '@/components/goals/GoalStatusBadge';
import AuthGuard from '@/components/layout/AuthGuard';
import type { Goal, User as AppUser, Organization } from '@/types';

export default function ApprovalsPage() {
  return (
    <AuthGuard allowedRoles={['TEAM_LEAD', 'EXECUTIVE', 'CEO']}>
      <ApprovalsContent />
    </AuthGuard>
  );
}

// 특정 orgId의 모든 하위 조직 ID 반환 (자신 포함)
function getDescendantOrgIds(orgId: string, orgs: Organization[]): string[] {
  const result: string[] = [orgId];
  const children = orgs.filter(o => o.parentId === orgId);
  for (const child of children) {
    result.push(...getDescendantOrgIds(child.id, orgs));
  }
  return result;
}

function ApprovalsContent() {
  const { userProfile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<Record<string, AppUser>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      try {
        const [allOrgs, allUsers] = await Promise.all([getOrganizations(), getAllUsers()]);
        const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));
        setUsers(userMap);

        // 조회할 조직 ID 목록 결정
        let orgIds: string[];
        if (userProfile!.role === 'EXECUTIVE') {
          // 임원: 자신의 조직 + 하위 조직 전체
          orgIds = getDescendantOrgIds(userProfile!.organizationId, allOrgs);
        } else {
          // 팀장: 본인 팀만
          orgIds = [userProfile!.organizationId];
        }

        const pendingGoals = await getPendingGoalsByOrganizations(orgIds);
        setGoals(pendingGoals);
      } catch (e) {
        console.error('승인 대기함 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile]);

  const isLead = userProfile?.role === 'TEAM_LEAD';
  const isExec = userProfile?.role === 'EXECUTIVE';

  // 역할별 필터링
  const approvalGoals = goals.filter(g => {
    const ownerRole = users[g.userId]?.role;
    if (isLead) {
      // 팀장: 팀원의 PENDING_APPROVAL
      return g.status === 'PENDING_APPROVAL' && ownerRole === 'MEMBER';
    }
    if (isExec) {
      // 임원: 팀원의 LEAD_APPROVED + 팀장의 PENDING_APPROVAL
      return g.status === 'LEAD_APPROVED' ||
        (g.status === 'PENDING_APPROVAL' && ownerRole === 'TEAM_LEAD');
    }
    return g.status === 'PENDING_APPROVAL';
  });

  const completionGoals = goals.filter(g => {
    if (g.status !== 'COMPLETED') return false;
    const ownerRole = users[g.userId]?.role;
    if (isLead) {
      // 팀장: 팀원의 완료 1차 확인 (leadApprovedBy 없는 것)
      return ownerRole === 'MEMBER' && !g.leadApprovedBy;
    }
    if (isExec) {
      // 임원: 팀원의 완료 최종 확인 (leadApprovedBy 있는 것) + 팀장의 완료 확인
      return (ownerRole === 'MEMBER' && !!g.leadApprovedBy && !g.approvedBy) ||
        (ownerRole === 'TEAM_LEAD' && !g.approvedBy);
    }
    return !g.approvedBy;
  });

  const abandonGoals = goals.filter(g => {
    if (g.status !== 'PENDING_ABANDON') return false;
    const ownerRole = users[g.userId]?.role;
    if (isLead) return ownerRole === 'MEMBER';
    if (isExec) return ownerRole === 'TEAM_LEAD';
    return true;
  });

  const isEmpty = approvalGoals.length === 0 && completionGoals.length === 0 && abandonGoals.length === 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="승인 대기함" />
      <div className="flex-1 p-6 space-y-6">

        {isEmpty && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckSquare className="mb-3 h-10 w-10" />
            <p className="text-sm">처리할 항목이 없습니다.</p>
          </div>
        )}

        {/* 목표 승인 요청 */}
        {(loading || approvalGoals.length > 0) && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {isLead ? '목표 승인 요청 — 1차 승인' : '목표 승인 요청 — 최종 승인'}
              {' '}({approvalGoals.length})
            </h3>
            {isLead && (
              <p className="text-xs text-gray-400">팀원 목표를 1차 승인하면 임원에게 최종 승인 요청이 갑니다.</p>
            )}
            {isExec && (
              <p className="text-xs text-gray-400">팀원 목표(1차 승인 완료) 및 팀장 목표의 최종 승인입니다.</p>
            )}
            {loading ? <SkeletonList /> : (
              <div className="space-y-2">
                {approvalGoals.map(goal => (
                  <ApprovalRow key={goal.id} goal={goal} requester={users[goal.userId]} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 완료 확인 요청 */}
        {(loading || completionGoals.length > 0) && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {isLead ? '완료 확인 요청 — 1차 확인' : '완료 확인 요청 — 최종 확인'}
              {' '}({completionGoals.length})
            </h3>
            {loading ? <SkeletonList /> : (
              <div className="space-y-2">
                {completionGoals.map(goal => (
                  <ApprovalRow key={goal.id} goal={goal} requester={users[goal.userId]} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* 포기 요청 */}
        {(loading || abandonGoals.length > 0) && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">
              포기 요청 ({abandonGoals.length})
            </h3>
            {loading ? <SkeletonList /> : (
              <div className="space-y-2">
                {abandonGoals.map(goal => (
                  <ApprovalRow key={goal.id} goal={goal} requester={users[goal.userId]} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function ApprovalRow({ goal, requester }: { goal: Goal; requester?: AppUser }) {
  return (
    <Link href={`/goals/${goal.id}`}>
      <div className="flex items-center justify-between rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <GoalStatusBadge status={goal.status} />
            <span className="font-medium text-gray-900 truncate">{goal.title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {requester?.name ?? '알 수 없음'}{requester?.position ? ` (${requester.position})` : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(goal.dueDate, 'MM/dd', { locale: ko })}까지
            </span>
            <span>가중치 {goal.weight}%</span>
          </div>
        </div>
        <span className="ml-4 text-xs text-blue-600 font-medium shrink-0">검토하기 →</span>
      </div>
    </Link>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2].map(i => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
