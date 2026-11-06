'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Download,
  Share2,
  Crown,
  Medal,
  FileSpreadsheet,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LeaderboardItem } from '@/types';

export default function OrganizerResultsPage() {
  const [results, setResults] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [categories, setCategories] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [resultsPublished, setResultsPublished] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      let url = '/api/organizer/results?';
      if (categoryFilter !== 'ALL') url += `category=${encodeURIComponent(categoryFilter)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);

        const distinctCats = Array.from(
          new Set((data.results || []).map((r: any) => r.category).filter(Boolean))
        ) as string[];
        setCategories(distinctCats);
      }

      // Check published status
      const settingsRes = await fetch('/api/organizer/settings');
      const settingsData = await settingsRes.json();
      if (settingsRes.ok && settingsData.settings) {
        setResultsPublished(settingsData.settings.results_published);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [categoryFilter]);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      let url = '/api/organizer/results?format=csv';
      if (categoryFilter !== 'ALL') url += `&category=${encodeURIComponent(categoryFilter)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to export CSV');

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `artvista-voting-results-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Error exporting CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await fetch('/api/organizer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results_published: !resultsPublished }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultsPublished(data.settings.results_published);
      }
    } catch (err) {
      alert('Error updating published status');
    } finally {
      setIsPublishing(false);
    }
  };

  const topThree = results.slice(0, 3);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Official Results & Rankings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Drawings sorted by total director votes in descending order. Equal vote counts share rank.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={resultsPublished ? 'primary' : 'outline'}
            onClick={handleTogglePublish}
            isLoading={isPublishing}
            className={resultsPublished ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}
          >
            <Share2 className="w-4 h-4" />
            <span>{resultsPublished ? 'Results Published' : 'Publish Results to Public'}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={handleExportCSV}
            isLoading={isExporting}
            disabled={results.length === 0}
            className="bg-white border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Top 3 Winners Podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topThree.map((item, index) => {
            const podiumConfig = [
              {
                badge: '🥇 1st Place Champion',
                border: 'border-amber-300 bg-gradient-to-b from-amber-50/60 to-white',
                tag: 'bg-amber-500 text-white',
              },
              {
                badge: '🥈 2nd Place Runner-Up',
                border: 'border-slate-300 bg-gradient-to-b from-slate-50/60 to-white',
                tag: 'bg-slate-500 text-white',
              },
              {
                badge: '🥉 3rd Place',
                border: 'border-orange-300 bg-gradient-to-b from-orange-50/60 to-white',
                tag: 'bg-orange-500 text-white',
              },
            ];
            const config = podiumConfig[index];

            return (
              <div
                key={item.id}
                className={`relative rounded-3xl border-2 p-6 flex flex-col items-center text-center shadow-md ${config.border}`}
              >
                <div
                  className={`absolute -top-3.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${config.tag}`}
                >
                  Rank #{item.rank}
                </div>

                <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mt-2 mb-3 shadow-xs">
                  <img
                    src={item.image_path}
                    alt={item.drawing_number}
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="text-xs font-black uppercase tracking-wider text-slate-800 mb-1">
                  {config.badge}
                </span>

                <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                  {item.drawing_title || 'Untitled Artwork'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: <strong className="text-slate-800">{item.student_name}</strong>
                </p>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md mt-1">
                  {item.drawing_number} {item.category ? `• ${item.category}` : ''}
                </span>

                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Ballots Cast</span>
                  <span className="font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-xl">
                    {item.vote_count} vote{item.vote_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ranked Leaderboard</h3>
            <span className="text-xs text-slate-400">Equal votes share ranks (1224 competition style)</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Artwork</th>
                <th className="py-3 px-4">Drawing ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4 text-center">Votes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading results...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No results to display.
                  </td>
                </tr>
              ) : (
                results.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          item.rank === 1
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                            : item.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : item.rank === 3
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        #{item.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={item.image_path} alt={item.drawing_number} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{item.drawing_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{item.student_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{item.drawing_title || 'Untitled'}</span>
                      {item.category && (
                        <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold text-xs">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {item.vote_count}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

