'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Weight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import GoalStatusBadge from './GoalStatusBadge';
import type { Goal } from '@/types';

export default function GoalCard({ goal }: { goal: Goal }) {
  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 line-clamp-1">{goal.title}</h3>
            <GoalStatusBadge status={goal.status} />
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{goal.description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 진행률 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>진행률</span>
              <span className="font-medium text-gray-700">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-1.5" />
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(goal.dueDate, 'MM/dd', { locale: ko })}까지
            </span>
            <span className="flex items-center gap-1">
              <Weight className="h-3.5 w-3.5" />
              가중치 {goal.weight}%
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
