import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  Layers,
  Shield,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { createLead, previewScore } from '../lib/api';
import { computeLeadScore } from '../lib/mlEngine';
import { Lead, PriorityTier } from '../types';

interface AddLeadViewProps {
  onLeadCreated: (lead: Lead) => void;
  onNavigate: (page: any) => void;
}

export const AddLeadView: React.FC<AddLeadViewProps> = ({ onLeadCreated, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: 'Fintech',
    company_size: '51-200',
    source: 'Inbound Demo',
    budget: 75000,
    timeline: '1-3 months',
    decision_maker_seniority: 'Director',
    intent_score: 85,
    tech_stack_match: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedLead, setSavedLead] = useState<Lead | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Live Score Preview state
  const [preview, setPreview] = useState<any>(() =>
    computeLeadScore({
      budget: 75000,
      decision_maker_seniority: 'Director',
      timeline: '1-3 months',
      company_size: '51-200',
      industry: 'Fintech',
      intent_score: 85,
      tech_stack_match: true,
    })
  );

  // Re-run preview on input changes
  useEffect(() => {
    try {
      const calculated = computeLeadScore({
        budget: Number(formData.budget) || 0,
        decision_maker_seniority: formData.decision_maker_seniority,
        timeline: formData.timeline,
        company_size: formData.company_size,
        industry: formData.industry,
        intent_score: Number(formData.intent_score) || 50,
        tech_stack_match: Boolean(formData.tech_stack_match),
      });
      setPreview(calculated);
    } catch (e) {
      console.error(e);
    }
  }, [formData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Contact name is required.';
    if (!formData.company.trim()) newErrors.company = 'Company name is required.';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email format (e.g., alex@company.com).';
    }
    if (formData.budget < 0) {
      newErrors.budget = 'Annual budget cannot be negative.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      setSubmitting(true);
      const created = await createLead(formData);
      setSavedLead(created);
      onLeadCreated(created);
    } catch (err: any) {
      setApiError(err.message || 'Failed to persist lead in database');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSavedLead(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      industry: 'Fintech',
      company_size: '51-200',
      source: 'Inbound Demo',
      budget: 50000,
      timeline: '1-3 months',
      decision_maker_seniority: 'Director',
      intent_score: 75,
      tech_stack_match: true,
    });
    setErrors({});
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <UserPlus className="w-6 h-6 text-emerald-400" />
          Add Single Lead
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Input prospect attributes to trigger real-time ML qualification scoring and database persistence.
        </p>
      </div>

      {/* Success State Notification */}
      {savedLead && (
        <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 text-slate-100 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Lead Successfully Evaluated & Stored!
              </h3>
              <p className="text-xs text-slate-300">
                Synchronized with database. Scored <span className="font-mono font-bold text-emerald-400">{savedLead.score}/100</span> ({savedLead.priority} Priority).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-emerald-300 block mb-1">Model Attribution:</span>
            {savedLead.explanation}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('leads-directory')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <span>View in Leads Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              Add Another Lead
            </button>
          </div>
        </div>
      )}

      {/* API Error Alert */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Two Column Form + Live Scoring Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jessica Sterling"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    errors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NovaScale Dynamics"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    errors.company ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors.company && <p className="text-[11px] text-rose-400 mt-1">{errors.company}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Business Email *
                </label>
                <input
                  type="email"
                  placeholder="jessica@novascale.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Industry Vertical
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Fintech">Fintech (High Affinity)</option>
                  <option value="Cybersecurity">Cybersecurity (High Affinity)</option>
                  <option value="Cloud & DevOps">Cloud & DevOps (High Affinity)</option>
                  <option value="AI & Data Tools">AI & Data Tools (High Affinity)</option>
                  <option value="Healthcare SaaS">Healthcare SaaS (Moderate)</option>
                  <option value="E-commerce">E-commerce (Moderate)</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other Vertical</option>
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Headcount / Company Size
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1,000 employees</option>
                  <option value="1000+">1,000+ employees (Enterprise)</option>
                </select>
              </div>

              {/* Annual Budget */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Annual Budget (USD ACV) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Decision Maker Seniority */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Buyer Authority / Seniority
                </label>
                <select
                  value={formData.decision_maker_seniority}
                  onChange={(e) => setFormData({ ...formData, decision_maker_seniority: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="C-Suite / VP">C-Suite / VP (Full Authority)</option>
                  <option value="Director">Director (Budget Owner)</option>
                  <option value="Manager / Lead">Manager / Lead (Influencer)</option>
                  <option value="Individual Contributor">Individual Contributor</option>
                </select>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Purchase Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Immediate (<1 mo)">Immediate (&lt; 1 month)</option>
                  <option value="1-3 months">1 - 3 months</option>
                  <option value="3-6 months">3 - 6 months</option>
                  <option value="Exploring (>6 mo)">Exploring (&gt; 6 months)</option>
                </select>
              </div>

              {/* Lead Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Acquisition Channel / Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-950/70 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Inbound Demo">Inbound Demo</option>
                  <option value="LinkedIn Outbound">LinkedIn Outbound</option>
                  <option value="Organic Search">Organic Search</option>
                  <option value="G2 / Review Sites">G2 / Review Sites</option>
                  <option value="Webinar / Event">Webinar / Event</option>
                  <option value="Referral">Partner Referral</option>
                  <option value="Paid Ads">Paid Search / Ads</option>
                </select>
              </div>
            </div>

            {/* Intent & Tech match row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Intent Rating ({formData.intent_score}/100)
                  </label>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={formData.intent_score}
                  onChange={(e) => setFormData({ ...formData, intent_score: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 sm:pt-6">
                <input
                  type="checkbox"
                  id="tech_match"
                  checked={formData.tech_stack_match}
                  onChange={(e) => setFormData({ ...formData, tech_stack_match: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-white/20 cursor-pointer"
                />
                <label htmlFor="tech_match" className="text-xs text-slate-200 cursor-pointer">
                  Native Stack Compatibility (Verified integration support)
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scoring & Storing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run ML Scorer & Save Lead</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Real-time Live Score Preview Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-5 h-fit border-emerald-500/20">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Live Simulation
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active v2.4
            </span>
          </div>

          <div className="text-center py-2 space-y-1">
            <div className="text-5xl font-extrabold font-mono text-white tracking-tight">
              {preview.score}
              <span className="text-lg text-slate-500 font-normal">/100</span>
            </div>
            <div className="pt-1">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  preview.priority === 'High'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : preview.priority === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {preview.priority} Priority · {preview.status}
              </span>
            </div>
          </div>

          {/* Real-time Feature Breakdown */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[11px] font-semibold uppercase text-slate-400 block">
              Estimated Feature Weights
            </span>
            {preview.feature_importance?.map((f: any) => (
              <div
                key={f.feature}
                className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-950/40 border border-white/5"
              >
                <span className="text-slate-300">{f.feature}</span>
                <span
                  className={`font-mono font-bold ${
                    f.impact === 'positive'
                      ? 'text-emerald-400'
                      : f.impact === 'negative'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  +{f.contribution} pts
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-semibold block mb-0.5">Scoring Engine Note:</span>
            {preview.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
