import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Award,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  BarChart2,
  DollarSign,
  PlusCircle,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { fetchDashboardStats, StatsResponse } from '../lib/api';
import { Lead } from '../types';

interface DashboardViewProps {
  onNavigate: (page: any) => void;
  onViewLead?: (lead: Lead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onViewLead }) => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm tracking-wide">Syncing ML qualification telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/20 text-rose-200 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>Error loading dashboard metrics</span>
        </div>
        <p className="text-sm text-rose-300">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Qualification Dashboard
            <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Live Engine
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time scoring distribution, high-priority opportunities, and human-in-the-loop review alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('add-lead')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Lead</span>
          </button>
          <button
            onClick={() => onNavigate('bulk-upload')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-300" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={loadData}
            title="Refresh statistics"
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Scored Leads</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{s.total}</div>
            <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
              Active Pipeline
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 truncate">
            Total ACV: <span className="text-slate-200 font-mono font-medium">${(s.totalPipelineValue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* High Priority */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover transition-all border-emerald-500/20">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">High Priority (Score ≥ 75)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">{s.highPriority}</div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {s.total > 0 ? Math.round((s.highPriority / s.total) * 100) : 0}% of total
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Instant executive follow-up ready
          </div>
        </div>

        {/* Review Queue Awaiting */}
        <div
          onClick={() => onNavigate('review-queue')}
          className="glass-panel p-5 rounded-2xl glass-panel-hover transition-all cursor-pointer border-amber-500/20 hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Review Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-amber-400 font-mono">{s.reviewQueue}</div>
            <span className="text-xs text-amber-300 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Audit Pending <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Borderline & anomalous signals
          </div>
        </div>

        {/* Qualification Rate */}
        <div className="glass-panel p-5 rounded-2xl glass-panel-hover transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Lead Score</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold text-white font-mono">{s.avgScore}<span className="text-slate-500 text-lg">/100</span></div>
            <span className="text-xs text-purple-300 font-medium">
              {s.conversionRate}% Qualified Rate
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Ensemble model calibrated
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Histogram */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Score Distribution (0 - 100)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Frequency count across qualification cohorts</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Target Mode: ≥ 75
            </span>
          </div>

          <div className="pt-4 space-y-3">
            {s.distribution.map((bucket) => {
              const maxCount = Math.max(...s.distribution.map((d) => d.count), 1);
              const percentage = Math.round((bucket.count / maxCount) * 100);
              const isHighBucket = bucket.range === '81-100' || bucket.range === '61-80';

              return (
                <div key={bucket.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 w-16">Range {bucket.range}</span>
                    <span className="font-mono font-medium text-slate-400">
                      {bucket.count} leads ({s.total > 0 ? Math.round((bucket.count / s.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isHighBucket
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : bucket.range === '41-60'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-500/70 to-rose-400/50'
                      }`}
                      style={{ width: `${Math.max(4, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Status Breakdown */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Lifecycle Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">Current state in qualification funnel</p>
          </div>

          <div className="space-y-2.5 my-auto">
            {Object.entries(s.statusCounts).map(([status, count]) => {
              const pct = s.total > 0 ? Math.round((count / s.total) * 100) : 0;
              return (
                <div
                  key={status}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === 'Qualified'
                          ? 'bg-emerald-400'
                          : status === 'Needs Review'
                          ? 'bg-amber-400'
                          : status === 'Disqualified'
                          ? 'bg-rose-400'
                          : 'bg-sky-400'
                      }`}
                    />
                    <span className="font-medium text-slate-200">{status}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-100 font-semibold">{count}</span>
                    <span className="text-slate-500 text-[11px] w-8 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => onNavigate('leads-directory')}
              className="w-full py-2 text-xs font-semibold text-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer"
            >
              Explore All Leads in Directory &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="glass-panel rounded-2xl overflow-hidden space-y-0">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Recent Lead Inflow</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest opportunities evaluated by LeadMatrix engine</p>
          </div>

          <button
            onClick={() => onNavigate('leads-directory')}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>View Full Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/40 text-slate-400 uppercase font-semibold tracking-wider">
                <th className="py-3 px-4">Contact & Company</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Annual Budget</th>
                <th className="py-3 px-4">ML Score</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {s.recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No leads registered yet. Click "Add Single Lead" to start.
                  </td>
                </tr>
              ) : (
                s.recent.map((lead) => {
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{lead.name}</div>
                        <div className="text-[11px] text-slate-400">{lead.company} · {lead.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {lead.industry}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                        ${lead.budget.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-sm ${
                              lead.score >= 75
                                ? 'text-emerald-400'
                                : lead.score >= 50
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {lead.score}
                          </span>
                          <span className="text-[10px] text-slate-500">/100</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-medium ${
                            lead.priority === 'High'
                              ? 'text-emerald-400'
                              : lead.priority === 'Medium'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            lead.status === 'Qualified'
                              ? 'text-emerald-400'
                              : lead.status === 'Needs Review'
                              ? 'text-amber-400'
                              : lead.status === 'Disqualified'
                              ? 'text-rose-400'
                              : 'text-sky-400'
                          }`}
                        >
                          {lead.status === 'Needs Review' ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : lead.status === 'Qualified' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : null}
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onViewLead) onViewLead(lead);
                            else onNavigate('leads-directory');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
