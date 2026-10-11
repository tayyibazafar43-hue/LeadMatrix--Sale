import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Cpu,
  ShieldCheck,
  Activity,
  Layers,
  Award,
  TrendingUp,
  RefreshCw,
  GitBranch,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { fetchAnalytics, AnalyticsResponse } from '../lib/api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm">Calculating model evaluation metrics & weights...</p>
      </div>
    );
  }

  const { model, featureWeights, industryBreakdown, seniorityCounts, totalLeads } = data!;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Analytics & Model Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ensemble model performance metrics, feature importance attribution, and vertical breakdown.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 hover:bg-white/5 transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Model Overview & Evaluation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Precision */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-medium">
            <span>Model Precision</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              {(model.precision * 100).toFixed(1)}%
            </div>
            <span className="text-xs text-slate-400">Validated</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">True positive conversion accuracy</p>
        </div>

        {/* Recall */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-medium">
            <span>Recall Rate</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-sky-400">
              {(model.recall * 100).toFixed(1)}%
            </div>
            <span className="text-xs text-slate-400">Coverage</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Viable opportunities captured</p>
        </div>

        {/* F1 Score */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-medium">
            <span>Harmonic F1 Score</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-purple-400">
              {model.f1_score.toFixed(3)}
            </div>
            <span className="text-xs text-slate-400">Balance</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Combined precision-recall metric</p>
        </div>

        {/* ROC-AUC */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-medium">
            <span>ROC-AUC Metric</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-3xl font-extrabold font-mono text-amber-400">
              {model.roc_auc.toFixed(3)}
            </div>
            <span className="text-xs text-slate-400">Discriminative</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Area under receiver curve</p>
        </div>
      </div>

      {/* Feature Importance Attribution Breakdown */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Global Feature Importance Weights (SHAP/Ensemble)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative algorithmic weighting assigned by the LeadMatrix scoring architecture
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {model.version}
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {featureWeights.map((fw) => (
            <div key={fw.feature} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{fw.feature}</span>
                <span className="font-mono text-emerald-400 font-bold">{fw.weight}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-950/70 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-700"
                  style={{ width: `${fw.weight * 3.5}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{fw.impactFactor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Vertical Performance Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Average score and total pipeline across industries</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Industry Vertical</th>
                  <th className="py-2.5 px-3">Leads</th>
                  <th className="py-2.5 px-3">Avg Score</th>
                  <th className="py-2.5 px-3 text-right">Total ACV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {industryBreakdown.map((ind) => (
                  <tr key={ind.name} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-medium text-white">{ind.name}</td>
                    <td className="py-2.5 px-3 font-mono">{ind.count}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-mono font-bold ${
                          ind.avgScore >= 75
                            ? 'text-emerald-400'
                            : ind.avgScore >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {ind.avgScore}/100
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                      ${ind.totalBudget.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buyer Seniority Representation */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Decision Maker Authority Mix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Prospect buyer distribution across active leads</p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(seniorityCounts).map(([title, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={title} className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{title}</span>
                    <span className="font-mono text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/80"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
