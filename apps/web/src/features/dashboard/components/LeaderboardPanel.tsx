import { Medal, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import type { LeaderboardEntry } from '../types';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  orgId?: string;
}

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-gold-300" aria-label="First place" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-300" aria-label="Second place" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-brand-400" aria-label="Third place" />;
  return (
    <span className="flex h-6 w-6 items-center justify-center text-xs font-bold text-slate-500">
      {rank}
    </span>
  );
}

export function LeaderboardPanel({ entries, isLoading, orgId }: LeaderboardPanelProps) {
  return (
    <Card className="flex h-full flex-col" aria-labelledby="leaderboard-title">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">People Engagement</p>
          <h2 id="leaderboard-title" className="mt-2 h-section">
            Gamification Leaderboard
          </h2>
          <p className="mt-1 text-sm text-slate-400">Top contributors by XP earned</p>
        </div>
        {orgId ? (
          <Link
            to={`/orgs/${orgId}/gamification`}
            className="text-xs font-semibold text-brand-300 hover:text-brand-200"
          >
            View all →
          </Link>
        ) : null}
      </header>

      <ol className="mt-6 flex-1 space-y-2" aria-label="XP leaderboard rankings">
        {isLoading ? (
          <li className="text-sm text-slate-500">Loading rankings…</li>
        ) : entries.length === 0 ? (
          <li className="text-sm text-slate-500">
            No XP recorded yet. Approved CSR and carbon activities earn points.
          </li>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <li key={entry.userId}>
              {orgId ? (
                <Link
                  to={`/orgs/${orgId}/employee-corner`}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition hover:border-brand-400/25 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5" aria-hidden>
                    {rankIcon(entry.rank)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {entry.firstName} {entry.lastName}
                    </p>
                    <p className="text-xs text-slate-500">Rank #{entry.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="num font-semibold text-brand-300">
                      {entry.totalXp.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">XP</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5" aria-hidden>
                    {rankIcon(entry.rank)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {entry.firstName} {entry.lastName}
                    </p>
                    <p className="text-xs text-slate-500">Rank #{entry.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="num font-semibold text-brand-300">
                      {entry.totalXp.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">XP</p>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ol>
    </Card>
  );
}
