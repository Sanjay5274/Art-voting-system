'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PublicDrawing } from '@/types';
import { KeyRound, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDrawings: PublicDrawing[];
  onVoteSuccess: () => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  selectedDrawings,
  onVoteSuccess,
}) => {
  const [votingCode, setVotingCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!votingCode.trim()) {
      setError('Please enter your unique voting code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voting_code: votingCode.trim(),
          drawing_ids: selectedDrawings.map((d) => d.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ballot');
      }

      setIsSuccess(true);
      setTimeout(() => {
        onVoteSuccess();
        setIsSuccess(false);
        setVotingCode('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error submitting vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-purple-600" />
          <span>Confirm & Submit Your Ballot</span>
        </div>
      }
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Ballot Successfully Recorded!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your votes for {selectedDrawings.length} artwork{selectedDrawings.length > 1 ? 's' : ''} have
            been securely logged. Your single-use voting code has now expired.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmitVote} className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter your single-use director voting code to authenticate and seal your ballot.
          </p>

          {/* Selected items summary */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
            <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>Selected Artworks ({selectedDrawings.length}):</span>
              <span className="text-[11px] font-normal text-purple-700">Confidential Ballot</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedDrawings.map((d) => (
                <span
                  key={d.id}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-extrabold text-[11px]"
                >
                  {d.drawing_number}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Unique Voting Code
            </label>
            <Input
              type="text"
              placeholder="e.g. VOTE-A7F2-9K3P"
              value={votingCode}
              onChange={(e) => setVotingCode(e.target.value.toUpperCase())}
              autoFocus
              required
              className="font-mono text-center text-base tracking-widest uppercase font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Codes are provided by the competition organizer and expire immediately upon use.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!votingCode.trim()}
            >
              Confirm Vote
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

