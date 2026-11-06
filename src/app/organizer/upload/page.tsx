'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Layers,
  Check,
  X,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileImage,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { validateImageMetadata } from '@/lib/validation';
import { OrganizerDrawing } from '@/types';

export interface BulkUploadItem {
  id: string;
  file: File;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  studentName: string;
  drawingTitle: string;
  category: string;
  status: 'idle' | 'presigning' | 'uploading' | 'registering' | 'success' | 'error';
  error: string | null;
  drawingNumber: string | null;
}

const CONCURRENCY_LIMIT = 5;

export default function OrganizerUploadPage() {
  const [items, setItems] = useState<BulkUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [uploadedDrawings, setUploadedDrawings] = useState<OrganizerDrawing[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [uploadSummary, setUploadSummary] = useState<{
    completed: boolean;
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingDrawings = async () => {
    try {
      setLoadingList(true);
      const res = await fetch('/api/organizer/drawings');
      const data = await res.json();
      if (res.ok) {
        setUploadedDrawings(data.drawings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchExistingDrawings();
  }, []);

  // Handle Selection of Multiple Files (Supports 60+ images)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newItems: BulkUploadItem[] = selectedFiles.map((file) => {
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      let autoStudent = '';
      let autoTitle = '';

      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        autoStudent = parts[0]?.trim() || '';
        autoTitle = parts.slice(1).join(' - ').trim();
      } else {
        autoStudent = rawName.replace(/[-_]/g, ' ').trim();
        autoTitle = '';
      }

      const clientValidation = validateImageMetadata(file.name, file.type, file.size);

      return {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        studentName: autoStudent,
        drawingTitle: autoTitle,
        category: bulkCategory || '',
        status: clientValidation.valid ? 'idle' : 'error',
        error: clientValidation.valid ? null : (clientValidation.error || 'Invalid file'),
        drawingNumber: null,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setUploadSummary(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeItem = (id: string) => {
    if (isUploading) return;
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateItem = (id: string, field: keyof BulkUploadItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyCategoryToAll = () => {
    if (!bulkCategory.trim()) return;
    setItems((prev) =>
      prev.map((item) =>
        item.status !== 'success' ? { ...item, category: bulkCategory.trim() } : item
      )
    );
  };

  // Upload single item via presign -> direct storage upload -> neon register
  const uploadSingleItem = async (item: BulkUploadItem): Promise<boolean> => {
    const validation = validateImageMetadata(item.file.name, item.file.type, item.file.size);
    if (!validation.valid) {
      updateItem(item.id, 'status', 'error');
      updateItem(item.id, 'error', validation.error || 'File validation failed');
      return false;
    }

    try {
      // Step A: Presign upload URL
      updateItem(item.id, 'status', 'presigning');
      updateItem(item.id, 'error', null);

      const presignRes = await fetch('/api/organizer/drawings/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: item.file.name,
          fileType: item.file.type || 'image/jpeg',
          fileSize: item.file.size,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || 'Failed to generate signed upload URL');
      }

      // Step B: Direct upload to Supabase Storage
      updateItem(item.id, 'status', 'uploading');
      const supabase = getSupabaseBrowserClient();

      const { error: storageError } = await supabase.storage
        .from('drawings')
        .uploadToSignedUrl(presignData.path, presignData.token, item.file, {
          contentType: item.file.type || 'image/jpeg',
        });

      if (storageError) {
        throw new Error(storageError.message || 'Direct storage upload failed');
      }

      // Step C: Register metadata in Neon PostgreSQL
      updateItem(item.id, 'status', 'registering');

      const registerRes = await fetch('/api/organizer/drawings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storagePath: presignData.path,
          studentName: item.studentName || 'Anonymous Student',
          drawingTitle: item.drawingTitle || null,
          category: item.category || null,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Database registration failed');
      }

      updateItem(item.id, 'status', 'success');
      updateItem(item.id, 'drawingNumber', registerData.drawing.drawing_number);
      return true;
    } catch (err: any) {
      console.error(`Upload error for ${item.fileName}:`, err);
      updateItem(item.id, 'status', 'error');
      updateItem(item.id, 'error', err.message || 'Upload failed');
      return false;
    }
  };

  // Controlled Batch Upload Engine (Runs at most 5 concurrent uploads)
  const startControlledUpload = async (itemsToUpload: BulkUploadItem[]) => {
    if (isUploading || itemsToUpload.length === 0) return;

    setIsUploading(true);
    setUploadSummary(null);

    let queue = [...itemsToUpload];

    const worker = async () => {
      while (queue.length > 0) {
        const currentItem = queue.shift();
        if (!currentItem) break;
        await uploadSingleItem(currentItem);
      }
    };

    const activeWorkers = Math.min(CONCURRENCY_LIMIT, itemsToUpload.length);
    const workerPromises = Array.from({ length: activeWorkers }, () => worker());

    await Promise.all(workerPromises);

    setIsUploading(false);
    await fetchExistingDrawings();

    setUploadSummary({
      completed: true,
      total: items.length,
      success: items.filter((i) => i.status === 'success').length,
      failed: items.filter((i) => i.status === 'error').length,
    });
  };

  const handleUploadAll = () => {
    const eligible = items.filter((i) => i.status !== 'success');
    startControlledUpload(eligible);
  };

  const handleRetryFailed = () => {
    const failedItems = items.filter((i) => i.status === 'error');
    startControlledUpload(failedItems);
  };

  const handleClearCompleted = () => {
    setItems((prev) => {
      const remaining = prev.filter((i) => i.status !== 'success');
      prev.filter((i) => i.status === 'success').forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return remaining;
    });
  };

  const handleDeleteDrawing = async (id: string, drawingNumber: string) => {
    if (!confirm(`Are you sure you want to delete drawing ${drawingNumber}?`)) return;
    try {
      const res = await fetch(`/api/organizer/drawings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete drawing');
        return;
      }
      await fetchExistingDrawings();
    } catch (err) {
      alert('Error deleting drawing');
    }
  };

  const totalItemsCount = items.length;
  const successItemsCount = items.filter((i) => i.status === 'success').length;
  const failedItemsCount = items.filter((i) => i.status === 'error').length;
  const pendingItemsCount = items.filter((i) => i.status !== 'success' && i.status !== 'error').length;
  const progressPercent = totalItemsCount > 0 ? Math.round((successItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Upload Drawings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select and upload 60+ student drawings directly into Supabase Storage with 5 concurrent workers.
        </p>
      </div>

      {/* Drag & Drop File Picker */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
          isUploading
            ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
            : 'border-purple-300 hover:border-purple-600 bg-purple-50/20 hover:bg-purple-50/40 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          disabled={isUploading}
          onChange={handleFilesSelected}
        />
        <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <Upload className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          {isUploading ? 'Batch Upload Running...' : 'Click or Drag & Drop 60+ Drawing Images'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Supports JPG, JPEG, PNG, WEBP (Up to 10MB per file) • 5 Concurrent Upload Workers
        </p>
      </div>

      {/* Quick Category Batch Fill Tool */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Batch Category:</span>
            <input
              type="text"
              placeholder="e.g. Juniors, Grade 8, Landscape"
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleApplyCategoryToAll}
              disabled={isUploading || !bulkCategory.trim()}
            >
              Apply to All Selected
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {successItemsCount > 0 && !isUploading && (
              <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
                Clear Completed ({successItemsCount})
              </Button>
            )}
            {failedItemsCount > 0 && !isUploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Failed ({failedItemsCount})
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleUploadAll}
              isLoading={isUploading}
              disabled={items.length === 0 || pendingItemsCount === 0}
              className="shadow-md shadow-purple-200"
            >
              <Upload className="w-4 h-4" />
              <span>
                {isUploading
                  ? `Uploading (5 Concurrent)...`
                  : `Upload All (${pendingItemsCount} Remaining)`}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Summary Alert */}
      {uploadSummary && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            uploadSummary.failed === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadSummary.failed === 0 ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-bold text-sm">
                {uploadSummary.failed === 0
                  ? 'All Selected Artwork Uploaded Successfully!'
                  : 'Batch Completed With Some Errors'}
              </p>
              <p className="mt-0.5">
                Total: <span className="font-bold">{uploadSummary.total}</span> | Succeeded:{' '}
                <span className="font-bold text-emerald-700">{uploadSummary.success}</span> | Failed:{' '}
                <span className="font-bold text-rose-700">{uploadSummary.failed}</span>
              </p>
            </div>
          </div>

          {uploadSummary.failed > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRetryFailed}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Failed ({uploadSummary.failed})
            </Button>
          )}
        </div>
      )}

      {/* Upload Queue Progress */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-3">
              <span>Total Selected: {totalItemsCount}</span>
              <span className="text-emerald-600">✓ Succeeded: {successItemsCount}</span>
              {failedItemsCount > 0 && <span className="text-rose-600">✗ Failed: {failedItemsCount}</span>}
              {pendingItemsCount > 0 && <span className="text-blue-600">⏳ Pending: {pendingItemsCount}</span>}
            </div>
            <span>{progressPercent}% Complete</span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Queue Items List */}
          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs ${
                  item.status === 'success'
                    ? 'bg-emerald-50/20'
                    : item.status === 'error'
                    ? 'bg-rose-50/20'
                    : 'bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 w-full">
                  <div>
                    <input
                      type="text"
                      placeholder="Student Name"
                      value={item.studentName}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateItem(item.id, 'studentName', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50"
                    />
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {item.fileName} ({(item.fileSize / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Drawing Title (optional)"
                      value={item.drawingTitle}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateItem(item.id, 'drawingTitle', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Category (optional)"
                      value={item.category}
                      disabled={item.status === 'success' || isUploading}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {item.status === 'idle' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Queued
                    </span>
                  )}
                  {item.status === 'presigning' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Presigning...
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Uploading Storage...
                    </span>
                  )}
                  {item.status === 'registering' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Registering...
                    </span>
                  )}
                  {item.status === 'success' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      {item.drawingNumber || 'Uploaded'}
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 max-w-[160px] truncate"
                      title={item.error || 'Error'}
                    >
                      {item.error || 'Failed'}
                    </span>
                  )}

                  {!isUploading && item.status !== 'success' && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currently Uploaded Drawings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Registered Competition Artwork ({uploadedDrawings.length})
          </h3>
          <span className="text-xs text-slate-400">Sequential Drawing IDs automatically assigned</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Preview</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4 text-center">Votes</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Loading drawings...
                  </td>
                </tr>
              ) : uploadedDrawings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No drawings registered yet. Use the upload area above to add artwork.
                  </td>
                </tr>
              ) : (
                uploadedDrawings.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={d.image_path} alt={d.drawing_number} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-black text-slate-900">{d.drawing_number}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-800">{d.student_name}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800">{d.drawing_title || 'Untitled'}</span>
                      {d.category && (
                        <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                          {d.category}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-700">{d.vote_count}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteDrawing(d.id, d.drawing_number)}
                        disabled={d.vote_count > 0}
                        title={d.vote_count > 0 ? 'Cannot delete: Drawing has votes' : 'Delete drawing'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          d.vote_count > 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

