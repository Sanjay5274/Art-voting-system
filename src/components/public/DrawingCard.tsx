'use client';

import React, { useState } from 'react';
import { Check, Plus, Eye } from 'lucide-react';
import { PublicDrawing } from '@/types';

interface DrawingCardProps {
  drawing: PublicDrawing;
  isSelected: boolean;
  onToggleSelect: (drawing: PublicDrawing) => void;
  onPreview: (drawing: PublicDrawing) => void;
  disabledSelection: boolean;
}

export const DrawingCard: React.FC<DrawingCardProps> = ({
  drawing,
  isSelected,
  onToggleSelect,
  onPreview,
  disabledSelection,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-lg flex flex-col ${
        isSelected
          ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Artwork Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
            <span className="text-xs">Loading Artwork...</span>
          </div>
        )}

        {imageError ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-purple-100 via-indigo-50 to-slate-100 text-slate-500 cursor-pointer"
            onClick={() => onPreview(drawing)}
          >
            <div className="w-12 h-12 rounded-full bg-purple-200/60 flex items-center justify-center text-purple-700 mb-2">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-700 text-center">
              {drawing.drawing_title || drawing.drawing_number}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">Click to preview</span>
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
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => onPreview(drawing)}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wider bg-white/95 text-slate-900 shadow-sm border border-slate-200 backdrop-blur-xs">
            {drawing.drawing_number}
          </span>
          {drawing.category && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-600/90 text-white backdrop-blur-xs shadow-xs">
              {drawing.category}
            </span>
          )}
        </div>

        {/* Inspect Preview Overlay Button */}
        <button
          onClick={() => onPreview(drawing)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors backdrop-blur-xs"
          title="Inspect Full-Size Artwork"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Selection Ribbon Badge if selected */}
        {isSelected && (
          <div className="absolute bottom-3 right-3 bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Selected
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          <h4
            onClick={() => onPreview(drawing)}
            className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-purple-600 transition-colors cursor-pointer"
          >
            {drawing.drawing_title || 'Untitled Artwork'}
          </h4>
        </div>

        {/* Select / Deselect Button */}
        <button
          onClick={() => onToggleSelect(drawing)}
          disabled={!isSelected && disabledSelection}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isSelected
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-xs'
              : disabledSelection
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Selected (Click to Remove)</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Select to Vote</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

