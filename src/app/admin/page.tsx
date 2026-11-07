'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Trash2,
  Download,
  RotateCcw,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Award,
} from 'lucide-react';
import { DrawingItem } from '@/lib/store';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'results'>('upload');

  // Login form state
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@1234');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Data state
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<DrawingItem & { rank: number }>>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  // Check session on load
  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/session');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadAdminData();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/results');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setDrawings(data.leaderboard || []);
        setTotalVotes(data.totalVotes || 0);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadAdminData();
      } else {
        setLoginError(data.error || 'Invalid email or password.');
      }
    } catch {
      setLoginError('Server error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadSuccessMessage(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(20);
    setUploadSuccessMessage(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      setUploadProgress(50);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadProgress(100);
        setUploadSuccessMessage(data.message || `Uploaded ${selectedFiles.length} drawings successfully!`);
        setSelectedFiles([]);
        loadAdminData();
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed due to network error.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDrawing = async (id: string, drawingNumber: string) => {
    if (!confirm(`Are you sure you want to delete ${drawingNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/drawings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadAdminData();
      } else {
        alert('Failed to delete drawing.');
      }
    } catch {
      alert('Failed to delete drawing.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Warning: This will delete ALL uploaded drawings and cannot be undone. Proceed?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/clear-all', { method: 'POST' });
      if (res.ok) {
        loadAdminData();
      }
    } catch {
      alert('Failed to clear drawings.');
    }
  };

  const handleResetVotes = async () => {
    if (!confirm('Are you sure you want to reset all vote counts back to 0?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-votes', { method: 'POST' });
      if (res.ok) {
        loadAdminData();
      }
    } catch {
      alert('Failed to reset votes.');
    }
  };

  // If loading session state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Checking admin access...
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <img src="/logo.png" alt="SCM Garments" className="h-16 w-auto object-contain mb-2" />
            <h1 className="text-xl font-extrabold text-slate-900">SCM Garments Pvt Ltd</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Drawing Competition Admin Portal
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin@1234"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm disabled:opacity-50"
            >
              {loggingIn ? 'Signing In...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-semibold"
            >
              <span>&larr; Back to Public Gallery</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="SCM Garments" className="h-10 w-auto object-contain" />
            <div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 block leading-tight">
                SCM Garments Admin Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">Logged in as admin@gmail.com</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Drawings ({drawings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'results'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Results & Leaderboard ({totalVotes} votes)</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: UPLOAD DRAWINGS */}
        {activeTab === 'upload' && (
          <div className="space-y-8">
            {/* Upload Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Upload Student Drawings</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Select drawings from your computer. You can upload multiple files at once (e.g. 60+ images).
                  Drawings will automatically receive sequential IDs (DRW-001, DRW-002...).
                </p>
              </div>

              {uploadSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <FileImage className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-sm text-slate-800">
                      Click to browse or drag and drop images here
                    </span>
                    <span className="text-xs text-slate-400">
                      Supports JPG, JPEG, PNG, and WEBP formats
                    </span>
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-between text-xs font-semibold">
                    <span>
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles([])}
                      className="text-rose-600 hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-slate-900 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium block text-right">
                      Uploading... {uploadProgress}%
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={selectedFiles.length === 0 || uploading}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-40"
                >
                  {uploading
                    ? 'Uploading...'
                    : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} Drawings`}
                </button>
              </form>
            </div>

            {/* Currently Uploaded List */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Uploaded Drawings ({drawings.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    All drawings currently live and visible on the voting page.
                  </p>
                </div>

                {drawings.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    Clear All Drawings
                  </button>
                )}
              </div>

              {drawings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No drawings uploaded yet. Use the upload box above to add student drawings.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
                  {drawings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col group relative"
                    >
                      <div className="aspect-square bg-slate-100 overflow-hidden relative">
                        <img
                          src={item.image_path}
                          alt={item.drawing_number}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-black bg-white/95 text-slate-900 shadow-xs border border-slate-200">
                          {item.drawing_number}
                        </span>
                      </div>
                      <div className="p-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate" title={item.drawing_title}>
                          {item.drawing_title || item.drawing_number}
                        </span>
                        <button
                          onClick={() => handleDeleteDrawing(item.id, item.drawing_number)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Delete drawing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RESULTS & LEADERBOARD */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Drawings
                </span>
                <span className="block text-3xl font-black text-slate-900">{drawings.length}</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Likes Cast
                </span>
                <span className="block text-3xl font-black text-rose-600">{totalVotes}</span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Leading Drawing 🏆
                </span>
                <span className="block text-3xl font-black text-slate-900">
                  {leaderboard.length > 0 && leaderboard[0].votes > 0
                    ? leaderboard[0].drawing_number
                    : '—'}
                </span>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Voting Results & Rankings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rankings are automatically sorted from highest votes to lowest.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href="/api/admin/results?format=csv"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>

                  <button
                    onClick={handleResetVotes}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Votes</span>
                  </button>
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No drawings or votes recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Drawing</th>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4 text-center">Likes</th>
                        <th className="py-3 px-4">Voters Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {item.rank === 1 && item.votes > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-black">
                                🥇 #1
                              </span>
                            ) : item.rank === 2 && item.votes > 0 ? (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-black">
                                🥈 #2
                              </span>
                            ) : item.rank === 3 && item.votes > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-black">
                                🥉 #3
                              </span>
                            ) : (
                              `#${item.rank}`
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="w-12 h-9 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                              <img
                                src={item.image_path}
                                alt={item.drawing_number}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            {item.drawing_number}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {item.drawing_title || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-rose-600 text-base">
                            {item.votes}
                          </td>
                          <td className="py-3.5 px-4">
                            {item.liked_by ? (
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {item.liked_by.split(',').map((name, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold"
                                  >
                                    {name.trim()}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
