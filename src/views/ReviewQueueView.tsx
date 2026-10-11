import React, { useEffect, useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Building,
  Mail,
  User,
  Sliders,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { fetchReviewQueue, submitReviewDecision } from '../lib/api';
import { Lead } from '../types';

interface ReviewQueueViewProps {
  onQueueUpdated?: () => void;
  onNavigate: (page: any) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({ onQueueUpdated, onNavigate }) => {
  const [queue, setQueue] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active review form state
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [overrideScore, setOverrideScore] = useState<number | ''>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchReviewQueue();
      setQueue(res.leads);
      if (res.leads.length > 0 && !activeLeadId) {
        setActiveLeadId(res.leads[0].id);
        setOverrideScore(res.leads[0].score);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch review queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (
    action: 'approve' | 'reject' | 'override',
    leadId: string
  ) => {
    try {
      setActionLoading(true);
      const res = await submitReviewDecision(
        leadId,
        action,
        notes,
        typeof overrideScore === 'number' ? overrideScore : undefined
      );

      setSuccessToast(
        `Lead ${res.lead.name} (${res.lead.company}) successfully ${
          action === 'approve' ? 'approved' : action === 'reject' ? 'disqualified' : 'overridden'
        }.`
      );

      // Remove from active queue
      setQueue((prev) => {
        const next = prev.filter((l) => l.id !== leadId);
        if (next.length > 0) {
          setActiveLeadId(next[0].id);
          setOverrideScore(next[0].score);
        } else {
          setActiveLeadId(null);
        }
        return next;
      });

      setNotes('');
      if (onQueueUpdated) onQueueUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to save review decision');
    } finally {
      setActionLoading(false);
    }
  };

  const activeLead = queue.find((l) => l.id === activeLeadId) || queue[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-amber-400" />
            Human-in-the-Loop Review Queue
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {queue.length} Pending
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit anomalous signals, verify borderline qualification scores, and submit executive decisions.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 hover:bg-white/5 transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Success notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {loading && (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
          <p className="text-sm">Fetching pending review opportunities...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && queue.length === 0 && (
        <div className="p-12 text-center rounded-3xl glass-panel space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Review Queue is Clear!</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All leads flagged by the ML qualification engine have been evaluated by human auditors.
          </p>
          <button
            onClick={() => onNavigate('leads-directory')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
          >
            Return to Leads Directory
          </button>
        </div>
      )}

      {/* Active Review Workspace */}
      {!loading && queue.length > 0 && activeLead && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of items awaiting review */}
          <div className="glass-panel rounded-3xl p-4 space-y-2.5 max-h-[75vh] overflow-y-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
              Select Lead to Audit ({queue.length})
            </span>
            {queue.map((lead) => {
              const isSelected = lead.id === activeLead.id;
              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    setActiveLeadId(lead.id);
                    setOverrideScore(lead.score);
                  }}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                      {lead.name}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {lead.score}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {lead.company} · {lead.industry}
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-medium mt-1 truncate">
                    Reason: {lead.review_notes || 'Flagged for borderline score'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 2 Columns: Audit Workspace */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div>
                <span className="text-xs font-mono text-amber-400">AUDIT CASE: {activeLead.id}</span>
                <h2 className="text-xl font-bold text-white mt-1">{activeLead.name}</h2>
                <p className="text-xs text-slate-400">
                  {activeLead.company} · {activeLead.industry} · {activeLead.email}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase text-slate-400 block font-medium">Model Score</span>
                <div className="text-3xl font-extrabold font-mono text-amber-400">
                  {activeLead.score}
                  <span className="text-sm text-slate-500 font-normal">/100</span>
                </div>
              </div>
            </div>

            {/* Audit Flag Explanation Card */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Trigger Condition Flag:
              </span>
              <p className="leading-relaxed">
                {activeLead.review_notes ||
                  'Score lies within the borderline evaluation band. Manual human review is required before advancing to sales reps.'}
              </p>
            </div>

            {/* Lead Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block">Annual Budget</span>
                <span className="text-slate-100 font-mono font-bold">${activeLead.budget.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block">Buyer Seniority</span>
                <span className="text-slate-200 font-medium">{activeLead.decision_maker_seniority}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block">Buying Timeline</span>
                <span className="text-slate-200 font-medium">{activeLead.timeline}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-500 block">Intent Score</span>
                <span className="text-slate-200 font-mono font-medium">{activeLead.intent_score}/100</span>
              </div>
            </div>

            {/* Decision Controls */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Auditor Decision Notes & Rationale
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record your audit observations, exception justifications, or account context..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Optional Score Calibration */}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-300 font-medium">Calibrate Score (Optional Override):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Decision Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleDecision('approve', activeLead.id)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.25)] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Qualify Lead</span>
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleDecision('reject', activeLead.id)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-600/90 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Disqualify Lead</span>
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleDecision('override', activeLead.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Submit Custom Override</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
