'use client';

import React from 'react';
import { X, Heart } from 'lucide-react';
import { DrawingItem } from '@/lib/store';

interface ImageModalProps {
  drawing: DrawingItem | null;
  hasVoted: boolean;
  onClose: () => void;
  onVote: (drawing: DrawingItem) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  drawing,
  hasVoted,
  onClose,
  onVote,
}) => {
  if (!drawing) return null;
  const likeCount = drawing.votes || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wider bg-slate-900 text-white">
              {drawing.drawing_number}
            </span>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-md">
              {drawing.drawing_title || drawing.drawing_number}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Image Body */}
        <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-4">
          <img
            src={drawing.image_path}
            alt={drawing.drawing_title || drawing.drawing_number}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>
              {likeCount} {likeCount === 1 ? 'total like' : 'total likes'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onVote(drawing)}
            className={`py-2.5 px-6 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
              hasVoted
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                hasVoted ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
            <span>{hasVoted ? 'Liked (Click to unlike)' : 'Like this Drawing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
