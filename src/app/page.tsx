'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DrawingCard } from '@/components/DrawingCard';
import { ImageModal } from '@/components/ImageModal';
import { Search, Heart, Flame } from 'lucide-react';
import { DrawingItem } from '@/lib/store';

export default function HomePage() {
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'likes'>('id');
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDrawing, setPreviewDrawing] = useState<DrawingItem | null>(null);

  // Load drawings from API
  const loadDrawings = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/public/drawings?search=${encodeURIComponent(searchQuery)}`
        : '/api/public/drawings';
      const res = await fetch(url);
      const data = await res.json();
      setDrawings(data.drawings || []);
    } catch (err) {
      console.error('Failed to load drawings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrawings(search);
  }, [search]);

  // Load previously voted IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scm_voted_drawings');
      if (saved) {
        setVotedIds(JSON.parse(saved));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleVote = async (drawing: DrawingItem) => {
    const isCurrentlyVoted = votedIds.includes(drawing.id);
    const action = isCurrentlyVoted ? 'unlike' : 'like';

    try {
      const res = await fetch('/api/public/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawing_id: drawing.id, action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        let nextVoted: string[];
        if (action === 'unlike') {
          nextVoted = votedIds.filter((id) => id !== drawing.id);
          setToastMessage(`Removed like from ${drawing.drawing_number}`);
        } else {
          nextVoted = Array.from(new Set([...votedIds, drawing.id]));
          setToastMessage(`Liked ${drawing.drawing_number}! ❤️`);
        }

        setVotedIds(nextVoted);
        try {
          localStorage.setItem('scm_voted_drawings', JSON.stringify(nextVoted));
        } catch {}

        // Update drawing vote count locally in state
        setDrawings((prev) =>
          prev.map((d) =>
            d.id === drawing.id ? { ...d, votes: data.totalVotes ?? (action === 'like' ? d.votes + 1 : Math.max(0, d.votes - 1)) } : d
          )
        );

        if (previewDrawing && previewDrawing.id === drawing.id) {
          setPreviewDrawing((prev) =>
            prev ? { ...prev, votes: data.totalVotes ?? (action === 'like' ? prev.votes + 1 : Math.max(0, prev.votes - 1)) } : null
          );
        }

        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(data.error || 'Failed to update like. Please try again.');
      }
    } catch (err) {
      console.error('Vote error:', err);
      alert('Network error. Please try again.');
    }
  };

  // Sort drawings according to selected filter
  const displayedDrawings = [...drawings].sort((a, b) => {
    if (sortBy === 'likes') {
      if (b.votes !== a.votes) return (b.votes || 0) - (a.votes || 0);
      return a.drawing_number.localeCompare(b.drawing_number);
    }
    return a.drawing_number.localeCompare(b.drawing_number);
  });

  const totalLikes = drawings.reduce((sum, d) => sum + (d.votes || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-sm border border-slate-700">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              SCM Garments Pvt Ltd
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Drawing Competition
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Welcome Directors. Please browse through the student drawings below and click{' '}
              <strong className="text-rose-600 font-semibold">&ldquo;Like (❤️)&rdquo;</strong> on your
              favourite artwork. The drawing with the most likes will be the winning drawing!
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 shrink-0">
            <div className="text-center">
              <span className="block text-2xl font-black text-slate-900">
                {drawings.length}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Drawings
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="block text-2xl font-black text-rose-600 flex items-center justify-center gap-1">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                {totalLikes}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total Likes
              </span>
            </div>
          </div>
        </section>

        {/* Search & Sort Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drawings by ID (e.g. DRW-001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('id')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                sortBy === 'id'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Order by ID
            </button>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                sortBy === 'likes'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Most Liked 🏆</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid or Empty State */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium text-sm">
            Loading drawings...
          </div>
        ) : drawings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <h3 className="text-lg font-bold text-slate-800">No drawings uploaded yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Drawings will appear here as soon as the administrator uploads them from the admin panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedDrawings.map((drawing) => (
              <DrawingCard
                key={drawing.id}
                drawing={drawing}
                hasVoted={votedIds.includes(drawing.id)}
                onVote={handleVote}
                onPreview={(d) => setPreviewDrawing(d)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Full-Screen Image Modal */}
      <ImageModal
        drawing={previewDrawing}
        hasVoted={previewDrawing ? votedIds.includes(previewDrawing.id) : false}
        onClose={() => setPreviewDrawing(null)}
        onVote={handleVote}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} SCM Garments Pvt Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
