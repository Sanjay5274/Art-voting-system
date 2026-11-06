'use client';

import React from 'react';
import Link from 'next/link';
import { Palette, CheckCircle2, XCircle, Trophy, Lock } from 'lucide-react';
import { CompetitionSettings } from '@/types';

interface PublicHeaderProps {
  settings: CompetitionSettings | null;
  onOpenResults?: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ settings, onOpenResults }) => {
  const votingOpen = settings?.voting_open ?? true;
  const resultsPublished = settings?.results_published ?? false;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-200 group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              ArtVista
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Drawing Competition
            </span>
          </div>
        </Link>

        {/* Status Badges & Quick Links */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              votingOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {votingOpen ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Voting Open
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-amber-600" />
                Voting Closed
              </>
            )}
          </span>

          {resultsPublished && onOpenResults && (
            <button
              onClick={onOpenResults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Official Results</span>
            </button>
          )}

          <Link
            href="/organizer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Competition Organizer Access"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Organizer Portal</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

