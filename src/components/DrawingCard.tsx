'use client';

import React, { useState } from 'react';
import { Heart, Maximize2 } from 'lucide-react';
import { DrawingItem } from '@/lib/store';

interface DrawingCardProps {
  drawing: DrawingItem;
  hasVoted: boolean;
  onVote: (drawing: DrawingItem) => void;
  onPreview: (drawing: DrawingItem) => void;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({
  drawing,
  hasVoted,
  onVote,
  onPreview,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const likeCount = drawing.votes || 0;

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
        hasVoted
          ? 'border-rose-400 ring-2 ring-rose-400/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
            <span className="text-xs">Loading image...</span>
          </div>
        )}

        {imageError ? (
          <div
            onClick={() => onPreview(drawing)}
            className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-400 cursor-pointer"
          >
            <span className="text-xs font-semibold">{drawing.drawing_number}</span>
            <span className="text-[11px] text-slate-400 mt-1">Click to view</span>
          </div>
        ) : (
          <img
            src={drawing.image_path}
            alt={drawing.drawing_title || drawing.drawing_number}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            onClick={() => onPreview(drawing)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg text-xs font-black tracking-wider bg-white/95 text-slate-900 shadow-sm border border-slate-200 backdrop-blur-xs">
            {drawing.drawing_number}
          </span>
        </div>

        {/* Top Right: Live Likes Badge & Zoom */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-xs border transition-colors ${
              hasVoted
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white/95 text-slate-700 border-slate-200'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                hasVoted ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
              }`}
            />
            <span>{likeCount}</span>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(drawing);
            }}
            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100 shadow-sm"
            title="View Full Size"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content & Like Action */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900 text-sm truncate">
            {drawing.drawing_title || drawing.drawing_number}
          </h3>
          <span className="text-xs font-bold text-slate-500 shrink-0">
            {likeCount} {likeCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onVote(drawing)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
            hasVoted
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
              : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01]'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              hasVoted ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'
            }`}
          />
          <span>{hasVoted ? 'Liked (Click to unlike)' : 'Like this Logo'}</span>
        </button>
      </div>
    </div>
  );
};
