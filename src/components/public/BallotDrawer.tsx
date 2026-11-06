'use client';

import React from 'react';
import { CheckCircle2, X, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PublicDrawing } from '@/types';

interface BallotDrawerProps {
  selectedDrawings: PublicDrawing[];
  maxSelections: number;
  onRemove: (drawingId: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  votingOpen: boolean;
}

export const BallotDrawer: React.FC<BallotDrawerProps> = ({
  selectedDrawings,
  maxSelections,
  onRemove,
  onClear,
  onSubmit,
  votingOpen,
}) => {
  if (selectedDrawings.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-200 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status & Counter */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0">
              {selectedDrawings.length}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Your Ballot: {selectedDrawings.length} of {maxSelections} Drawings Selected
              </p>
              <p className="text-xs text-slate-500">
                {selectedDrawings.length < maxSelections
                  ? `You can choose up to ${maxSelections - selectedDrawings.length} more drawing${
                      maxSelections - selectedDrawings.length > 1 ? 's' : ''
                    }.`
                  : 'You have reached the maximum allowed selections.'}
              </p>
            </div>
          </div>

          {/* Selected Artwork Thumbnails Strip */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            {selectedDrawings.map((drawing) => (
              <div
                key={drawing.id}
                className="relative group shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-purple-600 bg-slate-100 shadow-xs"
              >
                <img
                  src={drawing.image_path}
                  alt={drawing.drawing_number}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemove(drawing.id)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title={`Remove ${drawing.drawing_number}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClear}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
            >
              Clear
            </button>
            <Button
              variant="primary"
              onClick={onSubmit}
              disabled={!votingOpen || selectedDrawings.length === 0}
              className="shadow-md shadow-purple-200 py-2.5 px-5"
            >
              <span>Submit Ballot</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

