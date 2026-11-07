'use client';

import React, { useState } from 'react';
import { User, X, Heart } from 'lucide-react';

interface NameModalProps {
  isOpen: boolean;
  drawingNumber?: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  drawingNumber,
  initialName = '',
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Please enter your name.');
      return;
    }
    if (clean.length < 2) {
      setError('Please enter at least 2 characters.');
      return;
    }
    setError(null);
    onSubmit(clean);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {drawingNumber ? `Like ${drawingNumber}` : 'Enter Your Name'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Please enter your name so your like is recorded on the leaderboard.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Enter Your Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your name will be saved on this device so you can like other drawings with 1 click.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm"
            >
              Confirm & Like
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

