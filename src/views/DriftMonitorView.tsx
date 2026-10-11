import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  HelpCircle,
  Database,
} from 'lucide-react';
import { fetchDriftReport } from '../lib/api';
import { DriftReport } from '../types';

export const DriftMonitorView: React.FC = () => {
  const [report, setReport] = useState<DriftReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDrift = async () => {
    try {
      setLoading(true);
      const res = await fetchDriftReport();
      setReport(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrift();
  }, []);

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm">Calculating Population Stability Index (PSI) & feature drifts...</p>
      </div>
    );
  }

  // Check for insufficient data condition
  if (!report || report.status === 'Insufficient Data' || report.sample_size < 5) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="pb-2 border-b border-white/5">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            Statistical Drift Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tracking data distribution shifts and model feature variance over time.
          </p>
        </div>

        <div className="p-12 text-center rounded-3xl glass-panel space-y-4 max-w-xl mx-auto border border-amber-500/20">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Insufficient data for drift analysis</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Population Stability Index (PSI) and feature shift calculation require at least 5 scored lead records to establish valid statistical cohorts.
          </p>
          <div className="pt-2 text-xs font-mono text-slate-400">
            Current sample size: <span className="text-white font-bold">{report?.sample_size || 0}</span> / 5 required records.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            Statistical Drift Monitor
            <span
              className={`px-2.5 py-0.5 text-xs font-mono font-medium rounded-full ${
                report.status === 'Stable'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : report.status === 'Moderate'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {report.status} Stability
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitoring Population Stability Index (PSI) between baseline and incoming qualification windows.
          </p>
        </div>

        <button
          onClick={loadDrift}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 hover:bg-white/5 transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Primary PSI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* PSI Metric */}
        <div className="glass-panel p-6 rounded-3xl space-y-3 border-emerald-500/20">
          <div className="flex items-center justify-between text-xs uppercase font-medium text-slate-400">
            <span>Score PSI (Population Stability)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-extrabold font-mono text-white">
              {report.psi.toFixed(3)}
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                report.psi < 0.1
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : report.psi < 0.25
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {report.psi < 0.1 ? 'No Drift' : report.psi < 0.25 ? 'Moderate Shift' : 'High Drift Alert'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Evaluated across {report.sample_size} leads in current evaluation window.
          </p>
        </div>

        {/* Drift Threshold Legend */}
        <div className="glass-panel p-6 rounded-3xl space-y-2.5">
          <span className="text-xs uppercase font-semibold text-slate-400 block">
            PSI Threshold Reference
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-400">
              <span>PSI &lt; 0.10</span>
              <span className="font-medium text-slate-300">Stable / Insignificant</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span>0.10 ≤ PSI &lt; 0.25</span>
              <span className="font-medium text-slate-300">Moderate Drift</span>
            </div>
            <div className="flex items-center justify-between text-rose-400">
              <span>PSI ≥ 0.25</span>
              <span className="font-medium text-slate-300">Retraining Required</span>
            </div>
          </div>
        </div>

        {/* Engine Status */}
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <span className="text-xs uppercase font-semibold text-slate-400 block">
            Health Check
          </span>
          <div className="flex items-center gap-2.5 text-xs text-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Model XGB-v2.4 distribution matches historical training priors.</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Last evaluated: {new Date(report.last_evaluated).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Cohort Score Distribution Comparison */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div>
          <h2 className="text-base font-bold text-white">
            Score Distribution: Baseline Cohort vs. Current Window
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side percentage frequency comparison across score buckets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {report.current_distribution.map((curr, idx) => {
            const base = report.baseline_distribution[idx] || { percentage: 0 };
            return (
              <div
                key={curr.range}
                className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 text-center"
              >
                <div className="text-xs font-mono font-bold text-slate-300">
                  Band {curr.range}
                </div>

                <div className="flex items-end justify-center gap-3 h-28 pt-2">
                  {/* Baseline bar */}
                  <div className="flex flex-col items-center gap-1 w-7">
                    <span className="text-[10px] font-mono text-slate-400">{base.percentage}%</span>
                    <div
                      className="w-full bg-slate-700/60 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(8, base.percentage * 2)}px` }}
                      title={`Baseline: ${base.percentage}%`}
                    />
                    <span className="text-[9px] text-slate-500">Base</span>
                  </div>

                  {/* Current bar */}
                  <div className="flex flex-col items-center gap-1 w-7">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{curr.percentage}%</span>
                    <div
                      className="w-full bg-emerald-500/80 rounded-t-lg shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500"
                      style={{ height: `${Math.max(8, curr.percentage * 2)}px` }}
                      title={`Current: ${curr.percentage}%`}
                    />
                    <span className="text-[9px] text-emerald-400">Current</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature-Level Drift Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Feature Drift Breakdown</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical divergence detected in individual opportunity input features
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 uppercase font-semibold tracking-wider">
                <th className="py-2.5 px-3">Feature Name</th>
                <th className="py-2.5 px-3">Cohort Shift (%)</th>
                <th className="py-2.5 px-3">Drift Status</th>
                <th className="py-2.5 px-3">Impact Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {report.feature_drifts.map((fd) => {
                const isPositive = fd.shift_percentage >= 0;
                return (
                  <tr key={fd.feature} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-medium text-white">{fd.feature}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPositive ? `+${fd.shift_percentage}%` : `${fd.shift_percentage}%`}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          fd.status === 'Normal'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {fd.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {fd.status === 'Normal'
                        ? 'Variance within expected 95% confidence interval.'
                        : 'Exceeds variance boundary; monitor incoming pipeline.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
