'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  KeyRound,
  CheckCircle2,
  Clock,
  Percent,
  Upload,
  Trophy,
  Share2,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/Button';
import { OrganizerStats } from '@/types';

export default function OrganizerDashboardPage() {
  const [stats, setStats] = useState<OrganizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organizer/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleVoting = async () => {
    if (!stats) return;
    try {
      setIsUpdating(true);
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voting_open: !stats.votingOpen }),
      });
      const data = await res.json();
      if (res.ok) {
        setStats((prev) => (prev ? { ...prev, votingOpen: data.settings.voting_open } : null));
      }
    } catch (err) {
      alert('Error updating voting status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!stats) return;
    try {
      setIsUpdating(true);
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results_published: !stats.resultsPublished }),
      });
      const data = await res.json();
      if (res.ok) {
        setStats((prev) =>
          prev ? { ...prev, resultsPublished: data.settings.results_published } : null
        );
      }
    } catch (err) {
      alert('Error updating published status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-purple-900/10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
            Competition Overview
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">Organizer Command Center</h1>
          <p className="text-xs text-purple-100/90 mt-1 max-w-xl">
            Upload artwork batches, issue single-use voting codes to directors, monitor live participation,
            and publish official competition winners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/organizer/upload">
            <Button variant="secondary" size="sm" className="bg-white text-purple-900 font-bold border-0 shadow-xs">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Bulk Upload</span>
            </Button>
          </Link>
          <Link href="/organizer/codes">
            <Button variant="secondary" size="sm" className="bg-purple-700 hover:bg-purple-600 text-white border-0 font-bold">
              <KeyRound className="w-4 h-4" />
              <span>Issue Codes</span>
            </Button>
          </Link>
          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 text-purple-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Competition Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Competition Status Controls</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage whether the public can vote and whether the final leaderboard is published.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Voting Open/Closed Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Voting:</span>
            <Button
              variant={stats?.votingOpen ? 'primary' : 'outline'}
              size="sm"
              onClick={handleToggleVoting}
              isLoading={isUpdating}
              className={stats?.votingOpen ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {stats?.votingOpen ? 'Voting is Open' : 'Voting is Closed'}
            </Button>
          </div>

          {/* Results Published Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Public Results:</span>
            <Button
              variant={stats?.resultsPublished ? 'primary' : 'outline'}
              size="sm"
              onClick={handleTogglePublish}
              isLoading={isUpdating}
              className={stats?.resultsPublished ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
            >
              <Share2 className="w-3.5 h-3.5" />
              {stats?.resultsPublished ? 'Results Published' : 'Results Hidden'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Submissions"
          value={stats?.totalDrawings ?? 0}
          subtitle="Registered student drawings"
          icon={ImageIcon}
          color="purple"
        />
        <StatCard
          title="Voting Codes Issued"
          value={stats?.totalCodesIssued ?? 0}
          subtitle={`${stats?.unusedCodes ?? 0} unused codes`}
          icon={KeyRound}
          color="blue"
        />
        <StatCard
          title="Ballots Cast"
          value={stats?.totalVotesSubmitted ?? 0}
          subtitle="Single-use votes submitted"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Voting Participation"
          value={`${stats?.votingCompletionPercentage ?? 0}%`}
          subtitle="Of issued codes redeemed"
          icon={Percent}
          color={stats?.votingCompletionPercentage === 100 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Top 3 Current Leaderboard Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Current Top Artwork Leaderboard</h3>
          </div>
          <Link
            href="/organizer/results"
            className="text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            Full Leaderboard & CSV →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {!stats?.topDrawings || stats.topDrawings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No votes have been recorded yet. Distribute single-use voting codes to begin.
            </div>
          ) : (
            stats.topDrawings.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={item.image_path}
                      alt={item.drawing_number}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900">
                        {item.drawing_number}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Rank #{item.rank}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {item.drawing_title || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500">Student: {item.student_name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold text-sm">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {item.vote_count} vote{item.vote_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

