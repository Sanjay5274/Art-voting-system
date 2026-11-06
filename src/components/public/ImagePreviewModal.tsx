'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { PublicDrawing } from '@/types';
import { Check, Plus } from 'lucide-react';

interface ImagePreviewModalProps {
  drawing: PublicDrawing | null;
  isOpen: boolean;
  onClose: () => void;
  isSelected: boolean;
  onToggleSelect: (drawing: PublicDrawing) => void;
  disabledSelection: boolean;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  drawing,
  isOpen,
  onClose,
  isSelected,
  onToggleSelect,
  disabledSelection,
}) => {
  if (!drawing) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg text-sm font-black bg-purple-100 text-purple-700 tracking-wider">
            {drawing.drawing_number}
          </span>
          <span className="text-slate-800 font-bold text-base truncate">
            {drawing.drawing_title || 'Untitled Artwork'}
          </span>
          {drawing.category && (
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
              {drawing.category}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Full-size Artwork display */}
        <div className="flex items-center justify-center bg-slate-950/5 rounded-2xl p-2 border border-slate-200 overflow-hidden min-h-[300px] max-h-[600px]">
          <img
            src={drawing.image_path}
            alt={drawing.drawing_title || drawing.drawing_number}
            className="w-full h-auto max-h-[580px] object-contain rounded-xl shadow-xs"
          />
        </div>

        {/* Footer with Select to Vote Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Student names are kept strictly confidential during voting.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSelect(drawing)}
              disabled={!isSelected && disabledSelection}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                  <span>Selected in Ballot</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Ballot</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

