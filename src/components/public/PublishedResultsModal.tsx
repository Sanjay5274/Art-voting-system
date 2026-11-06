'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Trophy, Star, Crown, Medal } from 'lucide-react';
import { LeaderboardItem } from '@/types';

interface PublishedResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishedResultsModal: React.FC<PublishedResultsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [results, setResults] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchResults();
    }
  }, [isOpen]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/results');
      const data = await res.json();
      if (data.published) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Error fetching public results:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span>Official Competition Results</span>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-xs text-slate-500">
          The competition has concluded and the official rankings have been published. Drawings with
          tied vote totals share the same rank.
        </p>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading official results...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No votes have been recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {results.map((item) => (
              <div key={item.id} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      item.rank === 1
                        ? 'bg-amber-100 text-amber-800'
                        : item.rank === 2
                        ? 'bg-slate-200 text-slate-800'
                        : item.rank === 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{item.rank}
                  </span>

                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img
                      src={item.image_path}
                      alt={item.drawing_number}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {item.drawing_number}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {item.drawing_title || 'Untitled'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold text-xs">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    {item.vote_count} vote{item.vote_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

