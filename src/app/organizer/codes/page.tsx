'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Download,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OrganizerCodesPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, used: 0, unused: 0 });
  const [loading, setLoading] = useState(true);

  // Generation State
  const [generateCount, setGenerateCount] = useState(20);
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestCodes, setLatestCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organizer/codes');
      const data = await res.json();
      if (res.ok) {
        setTokens(data.tokens || []);
        setSummary(data.summary || { total: 0, used: 0, unused: 0 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerateCodes = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/organizer/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: generateCount }),
      });
      const data = await res.json();
      if (res.ok) {
        setLatestCodes(data.codes || []);
        await fetchTokens();
      } else {
        alert(data.error || 'Failed to generate codes');
      }
    } catch (err) {
      alert('Error generating voting codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAll = () => {
    if (latestCodes.length === 0) return;
    navigator.clipboard.writeText(latestCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (latestCodes.length === 0) return;
    const blob = new Blob([latestCodes.join('\r\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artvista-voting-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Single-Use Voting Codes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Issue single-use authentication codes to company directors. Only cryptographic SHA-256 hashes
          are stored in the database.
        </p>
      </div>

      {/* Code Generation Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Generate New Voting Codes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select quantity to generate. Copy or download immediately; plaintext codes are not retained.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
            >
              <option value={10}>10 Codes</option>
              <option value={20}>20 Codes</option>
              <option value={50}>50 Codes</option>
              <option value={100}>100 Codes</option>
            </select>

            <Button
              variant="primary"
              onClick={handleGenerateCodes}
              isLoading={isGenerating}
              className="shadow-md shadow-purple-200"
            >
              <Plus className="w-4 h-4" />
              <span>Generate {generateCount} Codes</span>
            </Button>
          </div>
        </div>

        {/* Display newly generated codes */}
        {latestCodes.length > 0 && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">
                Freshly Generated Codes ({latestCodes.length})
              </span>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopyAll} className="bg-white text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy All'}</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownloadTxt} className="bg-white text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .TXT</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {latestCodes.map((c, i) => (
                <div
                  key={i}
                  className="bg-white px-2.5 py-1.5 rounded-lg border border-purple-200 text-center font-mono font-bold text-xs text-purple-950 select-all"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Issued</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.total}</p>
          <p className="text-xs text-slate-500 mt-0.5">Single-use voting tokens in DB</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Redeemed / Used</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary.used}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ballots cast successfully</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available / Unused</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{summary.unused}</p>
          <p className="text-xs text-slate-500 mt-0.5">Codes pending redemption</p>
        </div>
      </div>

      {/* Tokens Audit Log */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Token Activity Log</h3>
          <span className="text-xs text-slate-400">Showing recent tokens</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Token ID</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Redeemed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    Loading tokens...
                  </td>
                </tr>
              ) : tokens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No voting codes have been generated yet.
                  </td>
                </tr>
              ) : (
                tokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{t.id}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      {t.is_used ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Redeemed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" /> Available
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {t.used_at ? new Date(t.used_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

