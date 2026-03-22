'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOneOnOnesByMember, getOneOnOnesByLeader, getAllUsers } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import type { OneOnOne, User } from '@/types';

export default function OneOnOnePage() {
  const { userProfile } = useAuth();
  const [rooms, setRooms] = useState<OneOnOne[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    async function load() {
      try {
        const [list, allUsers] = await Promise.all([
          userProfile!.role === 'TEAM_LEAD'
            ? getOneOnOnesByLeader(userProfile!.id)
            : getOneOnOnesByMember(userProfile!.id),
          getAllUsers(),
        ]);
        const sorted = list.sort((a, b) => {
          const ta = a.lastMessageAt ?? a.createdAt;
          const tb = b.lastMessageAt ?? b.createdAt;
          return tb.getTime() - ta.getTime();
        });
        setRooms(sorted);
        setUsers(Object.fromEntries(allUsers.map(u => [u.id, u])));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile]);

  const isLead = userProfile?.role === 'TEAM_LEAD';

  return (
    <div className="flex flex-col h-full">
      <Header title="1on1" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">팀장·팀원 간 1on1 질의응답을 진행합니다.</p>
          <Link href="/oneon1/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> 대화 시작
            </Button>
          </Link>
        </div>

        {loading ? (
          <SkeletonList />
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-gray-50 py-16">
            <MessageCircle className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              {isLead ? '대화를 시작해보세요.' : '팀장이 대화를 시작하면 여기에 표시됩니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map(room => {
              const counterpart = users[isLead ? room.memberId : room.leaderId];
              const lastAt = room.lastMessageAt ?? room.createdAt;
              return (
                <Link key={room.id} href={`/oneon1/${room.id}`}>
                  <div className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                      {counterpart?.name?.[0] ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {counterpart?.name ?? '알 수 없음'}
                          {room.title && (
                            <span className="ml-2 text-xs text-gray-400 font-normal">· {room.title}</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatDistanceToNow(lastAt, { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {room.lastMessagePreview ?? '아직 메시지가 없습니다.'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
