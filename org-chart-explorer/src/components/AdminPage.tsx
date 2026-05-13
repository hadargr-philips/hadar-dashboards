import React, { useState, useCallback, useRef } from 'react';
import {
  X, Shield, Eye, EyeOff, CheckCircle2, XCircle, Loader2,
  Copy, Check, Upload, Database, Type,
} from 'lucide-react';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { isDbConfigured, saveOrgConfig, SETUP_SQL } from '../lib/db';
import { parseExcelFile } from '../utils/excelParser';

const ADMIN_PASSWORD = 'Phil2026!';

// ─── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close admin panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter the admin password to access data management tools.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError(false); }}
              placeholder="Admin password"
              autoFocus
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                ${error
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/10 dark:border-red-600'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 flex-shrink-0" /> Incorrect password
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ onClose }: { onClose: () => void }) {
  const {
    employees, fileName, fileDate, siteTitle, lastUpdated,
    setEmployees, setSiteTitle,
  } = useEmployeeStore(s => ({
    employees: s.employees,
    fileName: s.fileName,
    fileDate: s.fileDate,
    siteTitle: s.siteTitle,
    lastUpdated: s.lastUpdated,
    setEmployees: s.setEmployees,
    setSiteTitle: s.setSiteTitle,
  }));

  const dbOk = isDbConfigured();

  // ── Title ───────────────────────────────────────────────────────────────────
  const [titleInput, setTitleInput] = useState(siteTitle);
  const [titleStatus, setTitleStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');

  const handleSaveTitle = async () => {
    if (!titleInput.trim()) return;
    setTitleStatus('saving');
    setSiteTitle(titleInput.trim());
    const ok = await saveOrgConfig({ title: titleInput.trim() });
    setTitleStatus(ok ? 'ok' : 'err');
    setTimeout(() => setTitleStatus('idle'), 3000);
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'ok' | 'err'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setUploadMsg('Please upload an Excel file (.xlsx or .xls)');
      setUploadStatus('err');
      return;
    }
    setUploadStatus('processing');
    setUploadMsg('');
    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelFile(buffer);
      if (result.errors.length > 0) {
        setUploadMsg(result.errors.join(' '));
        setUploadStatus('err');
        return;
      }
      const dateStr = new Date(file.lastModified).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      setEmployees(result.employees, file.name, dateStr);
      const ok = await saveOrgConfig({
        employees: result.employees,
        file_name: file.name,
        file_date: dateStr,
      });
      setUploadMsg(
        ok
          ? `${result.employees.length} employees loaded and saved to database.`
          : `${result.employees.length} employees loaded locally. Database save failed — check configuration.`,
      );
      setUploadStatus('ok');
    } catch {
      setUploadMsg('Unexpected error reading the file.');
      setUploadStatus('err');
    }
  }, [setEmployees]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── SQL copy ─────────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL).catch(() => { /* ignore in non-secure contexts */ });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Database Status */}
        <Section title="Database Status" icon={Database}>
          <div className={`flex items-center gap-2 text-sm font-medium mb-3
            ${dbOk ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {dbOk
              ? <><CheckCircle2 className="w-4 h-4" /> Connected to Supabase</>
              : <><XCircle className="w-4 h-4" /> Database not configured</>
            }
          </div>
          {employees.length > 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><span className="font-medium">{employees.length}</span> employees in database</p>
              {fileName && (
                <p>File: <span className="font-medium">{fileName}</span>
                  {fileDate && <span className="text-gray-400"> · {fileDate}</span>}
                </p>
              )}
              {lastUpdated && (
                <p>Last updated: <span className="font-medium">{formatDate(lastUpdated)}</span></p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No employee data loaded yet.</p>
          )}
        </Section>

        {/* Database Setup — only shown when not configured */}
        {!dbOk && (
          <Section title="Database Setup (One-time)" icon={Database}>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p>To enable persistent storage shared across all users:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Create a free account at{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    supabase.com
                  </a>{' '}
                  and create a new project.
                </li>
                <li>Go to <strong>SQL Editor</strong> and run this setup script:</li>
              </ol>

              <div className="relative mt-2">
                <pre className="bg-gray-900 text-green-300 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre leading-relaxed">
                  {SETUP_SQL}
                </pre>
                <button
                  onClick={copySql}
                  className="absolute top-2 right-2 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                >
                  {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy SQL</>}
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-2" start={3}>
                <li>Go to <strong>Project Settings → API</strong>. Copy your Project URL and anon/public key.</li>
                <li>
                  Create{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                    org-chart-explorer/.env.local
                  </code>{' '}
                  with:
                </li>
              </ol>
              <pre className="bg-gray-100 dark:bg-gray-800 text-xs rounded-xl p-3 overflow-x-auto">
                {`VITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
              <ol className="list-decimal list-inside space-y-2" start={5}>
                <li>
                  Run{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                    npm run build
                  </code>{' '}
                  inside{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                    org-chart-explorer/
                  </code>.
                </li>
                <li>
                  Commit the generated{' '}
                  <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                    org-chart/
                  </code>{' '}
                  folder to the repo — GitHub Pages will serve it automatically.
                </li>
              </ol>
            </div>
          </Section>
        )}

        {/* Upload Employee Data */}
        <Section title="Upload Employee Data" icon={Upload}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload an Excel file to replace all existing employee data.
            {!dbOk && (
              <span className="text-amber-600 dark:text-amber-400">
                {' '}Database not configured — data will only persist for this browser session.
              </span>
            )}
          </p>

          <div
            className={`relative rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors select-none
              ${uploadStatus === 'processing'
                ? 'border-blue-300 bg-blue-50/40 dark:bg-blue-900/10 cursor-default'
                : dragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-copy'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/40 cursor-pointer'
              }`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => uploadStatus !== 'processing' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            {uploadStatus === 'processing' ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Processing file…</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Drop an Excel file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">.xlsx · .xls</p>
              </>
            )}
          </div>

          {uploadStatus === 'ok' && (
            <div className="mt-3 flex items-start gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{uploadMsg}</span>
            </div>
          )}
          {uploadStatus === 'err' && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{uploadMsg}</span>
            </div>
          )}
        </Section>

        {/* Site Title */}
        <Section title="Customize Site Title" icon={Type}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Change the title displayed on the home page.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={titleInput}
              onChange={e => { setTitleInput(e.target.value); setTitleStatus('idle'); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
              placeholder="Enter site title…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                         bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSaveTitle}
              disabled={!titleInput.trim() || titleStatus === 'saving'}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {titleStatus === 'saving'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : 'Save Title'
              }
            </button>
          </div>
          {titleStatus === 'ok' && (
            <p className="mt-2.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Title saved{!dbOk && ' locally — configure DB to persist across users'}
            </p>
          )}
          {titleStatus === 'err' && (
            <p className="mt-2.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Failed to save to database
            </p>
          )}
        </Section>

      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminPage({ onClose }: { onClose: () => void }) {
  const [authed, setAuthed] = useState(false);
  return authed
    ? <AdminDashboard onClose={onClose} />
    : <PasswordGate onSuccess={() => setAuthed(true)} onClose={onClose} />;
}
