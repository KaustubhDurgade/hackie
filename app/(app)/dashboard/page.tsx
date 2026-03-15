'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';

const PHASE_NAMES: Record<number, string> = {
  1: 'Idea',
  2: 'Features',
  3: 'Architecture',
  4: 'Tech Stack',
  5: 'Pitch',
};

interface SessionSummary {
  id: string;
  track: string | null;
  timeLimitHrs: number | null;
  teamSize: number | null;
  currentPhase: number;
  tokensUsed: number;
  tokenBudget: number;
  createdAt: string;
  _count: { messages: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push('/sign-in'); return; }

    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => { if (data.sessions) setSessions(data.sessions); })
      .finally(() => setLoading(false));
  }, [isLoaded, user, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-[#a8a29e] text-xs animate-pulse uppercase tracking-widest">loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1917]">
      {/* Nav */}
      <nav className="border-b border-[#e2ddd6] bg-white px-8 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight hover:text-[#6b6560] transition-colors">
          hackie
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/session/new"
            className="text-sm bg-[#1c1917] text-white px-4 py-1.5 rounded-xl hover:bg-[#3a3530] transition-colors font-medium"
          >
            New project
          </Link>
          <UserButton
            userProfileUrl="/account"
            userProfileMode="navigation"
            appearance={{
              variables: { colorBackground: '#ffffff', colorText: '#1c1917', borderRadius: '8px' },
              elements: {
                avatarBox: 'w-7 h-7',
                userButtonPopoverCard: 'bg-white border border-[#e2ddd6] shadow-md rounded-xl',
                userButtonPopoverActionButton: 'text-[#1c1917] hover:bg-[#f5f3ef] rounded-lg',
                userButtonPopoverActionButtonText: 'text-[#1c1917] text-xs uppercase tracking-widest',
                userButtonPopoverFooter: 'hidden',
              },
            }}
          />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-10">
          <p className="font-display text-xs tracking-widest uppercase text-[#a8a29e] mb-2">Dashboard</p>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {user?.firstName ? `${user.firstName}'s projects` : 'Your projects'}
          </h1>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white border border-[#e2ddd6] rounded-2xl p-12 text-center">
            <p className="font-serif text-xl font-bold text-[#c8c1b8] mb-2">no projects yet.</p>
            <p className="text-[#a8a29e] text-sm mb-6">Start a new project to get going.</p>
            <Link
              href="/session/new"
              className="inline-flex items-center gap-2 bg-[#1c1917] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#3a3530] transition-colors"
            >
              Start hacking →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* New project card */}
            <Link
              href="/session/new"
              className="group flex items-center gap-4 border border-dashed border-[#e2ddd6] bg-white hover:border-[#b8956a] hover:shadow-sm rounded-2xl p-5 transition-all"
            >
              <div className="w-10 h-10 border border-[#e2ddd6] group-hover:border-[#b8956a] rounded-xl flex items-center justify-center text-[#c8c1b8] group-hover:text-[#b8956a] transition-colors text-lg">
                +
              </div>
              <div>
                <p className="text-sm font-medium text-[#a8a29e] group-hover:text-[#1c1917] transition-colors">New project</p>
                <p className="text-[11px] text-[#c8c1b8] uppercase tracking-widest mt-0.5">Start from scratch</p>
              </div>
            </Link>

            {/* Session cards */}
            {sessions.map(s => {
              const date = new Date(s.createdAt);
              const ago  = getTimeAgo(date);
              const pct  = Math.round((s.tokensUsed / s.tokenBudget) * 100);
              return (
                <Link
                  key={s.id}
                  href={`/session/${s.id}`}
                  className="group flex items-center gap-5 border border-[#e2ddd6] bg-white hover:border-[#c8c1b8] hover:shadow-sm rounded-2xl p-5 transition-all"
                >
                  {/* Phase badge */}
                  <div className="w-10 h-10 border border-[#e2ddd6] group-hover:border-[#b8956a] rounded-xl flex items-center justify-center shrink-0 transition-colors">
                    <span className="font-display text-[11px] font-bold text-[#c8c1b8] group-hover:text-[#b8956a] transition-colors">
                      {String(s.currentPhase).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1c1917] truncate font-serif">
                      {s.track ?? 'Open track'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-[#a8a29e] uppercase tracking-widest">
                        Phase {s.currentPhase} · {PHASE_NAMES[s.currentPhase] ?? 'Unknown'}
                      </span>
                      {s.timeLimitHrs && (
                        <span className="text-[11px] text-[#c8c1b8]">{s.timeLimitHrs}h</span>
                      )}
                      {s._count.messages > 0 && (
                        <span className="text-[11px] text-[#c8c1b8]">{s._count.messages} messages</span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-[#a8a29e] uppercase tracking-widest">{ago}</p>
                    {pct > 5 && (
                      <div className="mt-1.5 w-16 h-1 bg-[#ede9e3] rounded-full relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 bg-[#b8956a] rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
