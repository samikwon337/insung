'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getGoalsByUser, getActiveCycle } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import GoalCard from '@/components/goals/GoalCard';
import type { Goal, EvaluationCycle } from '@/types';

export default function GoalsPage() {
  const { userProfile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      const [goalList, activeCycle] = await Promise.all([
        getGoalsByUser(userProfile!.id, new Date().getFullYear()),
        getActiveCycle(),
      ]);
      setGoals(goalList);
      setCycle(activeCycle);
      setLoading(false);
    }
    load();
  }, [userProfile]);

  const totalWeight = goals
    .filter(g => !['ABANDONED', 'REJECTED'].includes(g.status))
    .reduce((sum, g) => sum + g.weight, 0);

  const inProgress = goals.filter(g =>
    ['APPROVED', 'IN_PROGRESS'].includes(g.status)
  );
  const pending = goals.filter(g =>
    ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'].includes(g.status)
  );
  const closed = goals.filter(g =>
    ['COMPLETED', 'PENDING_ABANDON', 'ABANDONED'].includes(g.status)
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="내 목표" />
      <div className="flex-1 p-6 space-y-5">

        {/* 요약 바 */}
        <div className="flex items-center justify-between rounded-xl border bg-white p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-500">
              {cycle?.year ?? new Date().getFullYear()}년 목표
            </span>
            <span>
              전체 <strong className="text-gray-900">{goals.length}</strong>개
            </span>
            <span className={totalWeight > 100 ? 'text-red-600 font-medium' : 'text-gray-700'}>
              가중치 합계 <strong>{totalWeight}%</strong>
              {totalWeight > 100 && ' ⚠ 100% 초과'}
            </span>
          </div>
          <Link href="/goals/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              목표 추가
            </Button>
          </Link>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              진행 중 ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              처리 필요 ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="closed">
              종료 ({closed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <GoalGrid goals={inProgress} loading={loading} emptyText="진행 중인 목표가 없습니다" />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <GoalGrid goals={pending} loading={loading} emptyText="처리가 필요한 목표가 없습니다" />
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <GoalGrid goals={closed} loading={loading} emptyText="종료된 목표가 없습니다" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GoalGrid({
  goals,
  loading,
  emptyText,
}: {
  goals: Goal[];
  loading: boolean;
  emptyText: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Target className="mb-3 h-10 w-10" />
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
    </div>
  );
}
