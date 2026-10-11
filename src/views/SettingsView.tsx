import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Sliders,
  Save,
  CheckCircle2,
  Copy,
  RefreshCw,
  RotateCcw,
  Shield,
  Download,
  ExternalLink,
} from 'lucide-react';
import { fetchSettings, saveSettings, resetDemoDataset, fetchLeads } from '../lib/api';
import { AppSettings } from '../types';

interface SettingsViewProps {
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshData }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((s) => setSettings(s))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const updated = await saveSettings(settings);
      setSettings(updated);
      setSuccessMsg('Application settings successfully saved.');
      setTimeout(() => setSuccessMsg(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset database to default seed opportunities? Any custom changes will be replaced with fresh benchmark leads.')) {
      return;
    }
    try {
      setResetting(true);
      await resetDemoDataset();
      setSuccessMsg('Dataset successfully reset to factory benchmark leads.');
      setTimeout(() => setSuccessMsg(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const copySupabaseSql = () => {
    const sql = `-- LeadMatrix Supabase Database Schema
create extension if not exists "uuid-ossp";

create table if not exists public.leads (
    id text primary key default ('lead_' || substr(md5(random()::text), 1, 8)),
    name text not null,
    company text not null,
    email text not null,
    phone text,
    industry text not null default 'Other',
    company_size text not null default '11-50',
    source text not null default 'Inbound Demo',
    budget numeric not null default 0,
    timeline text not null default '3-6 months',
    decision_maker_seniority text not null default 'Manager / Lead',
    intent_score integer not null default 50,
    tech_stack_match boolean not null default false,
    score integer not null default 50,
    priority text not null check (priority in ('High', 'Medium', 'Low')),
    status text not null check (status in ('New', 'Qualified', 'Needs Review', 'Disqualified', 'Contacted', 'Won')),
    review_decision text not null default 'Pending',
    review_notes text,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    explanation text,
    feature_importance jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leads enable row level security;
create policy "Allow all access" on public.leads for all using (true) with check (true);
`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const exportAllLeadsJson = async () => {
    const res = await fetchLeads({ limit: 1000 });
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `LeadMatrix_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    dl.click();
    dl.remove();
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm">Loading application configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-400" />
            Engine Settings & Calibration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure scoring thresholds, feature weights, Supabase integration, and storage backups.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] self-start md:self-auto cursor-pointer"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Preferences</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Model Qualification Thresholds */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Qualification Score Thresholds
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define boundaries for automated qualification tiers and human-in-the-loop review routing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                High Priority Boundary (Score ≥ X)
              </label>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {settings.model_threshold_high}/100
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="90"
              value={settings.model_threshold_high}
              onChange={(e) =>
                setSettings({ ...settings, model_threshold_high: Number(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Leads at or above this score are automatically qualified for immediate executive outreach.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Review Queue Band (Score &ge; X)
              </label>
              <span className="font-mono text-xs font-bold text-amber-400">
                {settings.model_threshold_review}/100
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="70"
              value={settings.model_threshold_review}
              onChange={(e) =>
                setSettings({ ...settings, model_threshold_review: Number(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Leads scoring between this floor and high-priority threshold are routed to the review queue.
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Integration & Schema Guide */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              Supabase Storage Integration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production database sync status and PostgreSQL table configuration
            </p>
          </div>

          <span
            className={`text-xs font-mono px-3 py-1 rounded-full border ${
              settings.supabase_connected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-white/10'
            }`}
          >
            {settings.supabase_connected ? 'Supabase Connected' : 'Persistent File Store Active'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            LeadMatrix automatically persists all leads, scores, review decisions, and audit notes. When{' '}
            <code className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">SUPABASE_URL</code> and{' '}
            <code className="text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code> are
            configured in the environment, the server synchronizes with your cloud Supabase database.
          </p>
          <p>
            If not configured, LeadMatrix operates with high-speed persistent server storage at{' '}
            <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">/data/leads.json</code>, guaranteeing zero data loss.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={copySupabaseSql}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            {copiedSql ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copied SQL to Clipboard!' : 'Copy Supabase SQL Schema'}</span>
          </button>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Data Management & Benchmarking
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Export JSON database snapshots or reset sample benchmark opportunities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportAllLeadsJson}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Export Database JSON Snapshot</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
          >
            {resetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>Reset to Benchmark Seed Leads</span>
          </button>
        </div>
      </div>
    </div>
  );
};
