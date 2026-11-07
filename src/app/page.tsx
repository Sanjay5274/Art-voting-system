'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DrawingCard } from '@/components/DrawingCard';
import { ImageModal } from '@/components/ImageModal';
import { NameModal } from '@/components/NameModal';
import { Search, Heart, User } from 'lucide-react';
import { DrawingItem } from '@/lib/store';

export default function HomePage() {
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [directorName, setDirectorName] = useState<string>('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingDrawing, setPendingDrawing] = useState<DrawingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDrawing, setPreviewDrawing] = useState<DrawingItem | null>(null);

  // Load director name from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('scm_director_name');
      if (savedName) {
        setDirectorName(savedName);
      }
    } catch {}
  }, []);

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

  const isVotedByMe = (drawing: DrawingItem): boolean => {
    if (!directorName) return false;
    const names = (drawing.liked_by || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return names.includes(directorName.trim().toLowerCase());
  };

  const executeVote = async (drawing: DrawingItem, name: string) => {
    const currentlyVoted = isVotedByMe(drawing);
    const action = currentlyVoted ? 'unlike' : 'like';

    try {
      const res = await fetch('/api/public/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawing_id: drawing.id,
          director_name: name,
          action,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (action === 'unlike') {
          setToastMessage(`Removed like from ${drawing.drawing_number}`);
        } else {
          setToastMessage(`${name} liked ${drawing.drawing_number}! ❤️`);
        }

        // Update drawings in state
        setDrawings((prev) =>
          prev.map((d) =>
            d.id === drawing.id
              ? {
                  ...d,
                  votes: data.totalVotes ?? (action === 'like' ? d.votes + 1 : Math.max(0, d.votes - 1)),
                  liked_by: data.liked_by ?? d.liked_by,
                }
              : d
          )
        );

        if (previewDrawing && previewDrawing.id === drawing.id) {
          setPreviewDrawing((prev) =>
            prev
              ? {
                  ...prev,
                  votes: data.totalVotes ?? (action === 'like' ? prev.votes + 1 : Math.max(0, prev.votes - 1)),
                  liked_by: data.liked_by ?? prev.liked_by,
                }
              : null
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

  const handleVoteClick = (drawing: DrawingItem) => {
    if (!directorName) {
      setPendingDrawing(drawing);
      setIsNameModalOpen(true);
      return;
    }
    executeVote(drawing, directorName);
  };

  const handleNameSubmit = (name: string) => {
    setDirectorName(name);
    try {
      localStorage.setItem('scm_director_name', name);
    } catch {}
    setIsNameModalOpen(false);

    if (pendingDrawing) {
      executeVote(pendingDrawing, name);
      setPendingDrawing(null);
    }
  };

  // Sort drawings by drawing number
  const displayedDrawings = [...drawings].sort((a, b) =>
    a.drawing_number.localeCompare(b.drawing_number, undefined, { numeric: true })
  );

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
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                SCM Garments Pvt Ltd
              </div>

              {/* Director Name Badge */}
              {directorName ? (
                <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-full text-xs font-semibold text-rose-800">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    Liking as: <strong className="font-bold text-rose-950">{directorName}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setPendingDrawing(null);
                      setIsNameModalOpen(true);
                    }}
                    className="text-rose-600 hover:text-rose-900 hover:underline text-[11px] ml-1 font-bold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPendingDrawing(null);
                    setIsNameModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold text-rose-700 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Enter Your Name</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Drawing Competition
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Welcome Directors. Please browse through the student drawings below and click{' '}
              <strong className="text-rose-600 font-semibold">&ldquo;Like (❤️)&rdquo;</strong> on your
              favourite artwork. The drawing with the most likes will be declared the winner!
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 shrink-0">
            <div className="text-center">
              <span className="block text-2xl font-black text-slate-900">{drawings.length}</span>
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

        {/* Search Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drawings by ID (e.g. DRW-001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
            />
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
                hasVoted={isVotedByMe(drawing)}
                onVote={handleVoteClick}
                onPreview={(d) => setPreviewDrawing(d)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Name Input Modal */}
      <NameModal
        isOpen={isNameModalOpen}
        drawingNumber={pendingDrawing?.drawing_number}
        initialName={directorName}
        onClose={() => {
          setIsNameModalOpen(false);
          setPendingDrawing(null);
        }}
        onSubmit={handleNameSubmit}
      />

      {/* Full-Screen Image Modal */}
      <ImageModal
        drawing={previewDrawing}
        hasVoted={previewDrawing ? isVotedByMe(previewDrawing) : false}
        onClose={() => setPreviewDrawing(null)}
        onVote={handleVoteClick}
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
