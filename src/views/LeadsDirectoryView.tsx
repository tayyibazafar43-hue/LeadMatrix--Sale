import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Shield,
  RefreshCw,
  Building,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { fetchLeads, updateLead, deleteLead, LeadsResponse } from '../lib/api';
import { Lead, LeadStatus, PriorityTier } from '../types';

interface LeadsDirectoryViewProps {
  initialSelectedLead?: Lead | null;
  onClearInitialLead?: () => void;
}

export const LeadsDirectoryView: React.FC<LeadsDirectoryViewProps> = ({
  initialSelectedLead,
  onClearInitialLead,
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Lead detail drawer & modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(initialSelectedLead || null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusUpdateVal, setStatusUpdateVal] = useState<LeadStatus>('Qualified');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (initialSelectedLead) {
      setSelectedLead(initialSelectedLead);
    }
  }, [initialSelectedLead]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res: LeadsResponse = await fetchLeads({
        search,
        status: statusFilter,
        priority: priorityFilter,
        industry: industryFilter,
        sort_by: sortBy,
        order: sortOrder,
        page,
        limit: 20,
      });
      setLeads(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [search, statusFilter, priorityFilter, industryFilter, sortBy, sortOrder, page]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleStatusUpdate = async (newStatus: LeadStatus) => {
    if (!selectedLead) return;
    try {
      setUpdateLoading(true);
      const updated = await updateLead(selectedLead.id, { status: newStatus });
      setSelectedLead(updated);
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setIsEditingStatus(false);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      setIsDeleting(true);
      await deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      setTotal((t) => Math.max(0, t - 1));
      if (selectedLead?.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      setLeadToDelete(null);
    } catch (err) {
      console.error('Failed to delete lead:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ['ID', 'Name', 'Company', 'Email', 'Phone', 'Industry', 'Budget', 'Score', 'Priority', 'Status', 'Timeline', 'Created At'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.company.replace(/"/g, '""')}"`,
      l.email,
      l.phone || '',
      l.industry,
      l.budget,
      l.score,
      l.priority,
      l.status,
      `"${l.timeline}"`,
      l.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LeadMatrix_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Leads Directory
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-slate-800 text-slate-300 border border-white/10">
              {total} Total
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, inspect AI qualification attributions, and manage sales prospects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadLeads}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/60 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
            title="Refresh Leads"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, company, email, or vertical..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="All">All Statuses</option>
              <option value="Qualified">Qualified</option>
              <option value="Needs Review">Needs Review</option>
              <option value="New">New</option>
              <option value="Disqualified">Disqualified</option>
              <option value="Contacted">Contacted</option>
              <option value="Won">Won</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950/60 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-emerald-500/50"
            >
              <option value="All">All Priorities</option>
              <option value="High">High (Score ≥ 75)</option>
              <option value="Medium">Medium (Score 50-74)</option>
              <option value="Low">Low (Score &lt; 50)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Leads Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Contact & Company</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">Vertical</th>
                <th
                  onClick={() => handleSort('budget')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Budget (ACV)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('score')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ML Score</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Fetching database records...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No leads found matching your criteria. Try adjusting the search or filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {lead.company} · {lead.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {lead.industry}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        ${lead.budget.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
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
                          {lead.status === 'Needs Review' && (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {lead.status === 'Qualified' && (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          {lead.status === 'Disqualified' && (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {lead.timeline}
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedLead(lead)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setLeadToDelete(lead)}
                          title="Delete Lead"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {leads.length > 0 ? (page - 1) * 20 + 1 : 0} to{' '}
            {Math.min(page * 20, total)} of {total} leads
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-slate-900/60 border border-white/5 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">
              Page {page} of {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-slate-900/60 border border-white/5 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => {
            setSelectedLead(null);
            if (onClearInitialLead) onClearInitialLead();
          }}
        >
          <div
            className="w-full max-w-xl h-full max-h-[92vh] glass-panel rounded-3xl p-6 overflow-y-auto space-y-6 shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono text-emerald-400">
                  {selectedLead.id}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedLead.name}
                </h2>
                <p className="text-sm text-slate-300 font-medium">
                  {selectedLead.company} · {selectedLead.industry}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedLead(null);
                  if (onClearInitialLead) onClearInitialLead();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Highlight Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-slate-400">
                  ML Qualification Score
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    selectedLead.priority === 'High'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : selectedLead.priority === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {selectedLead.priority} Priority Tier
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold font-mono text-white">
                  {selectedLead.score}
                </span>
                <span className="text-slate-400 text-sm">/ 100 confidence</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Model Attribution Rationale:
                </p>
                {selectedLead.explanation}
              </div>
            </div>

            {/* Contact & Deal Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Opportunity Parameters
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Email</span>
                  <span className="text-slate-200 font-medium break-all">{selectedLead.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Phone</span>
                  <span className="text-slate-200 font-medium">{selectedLead.phone || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Annual Budget</span>
                  <span className="text-slate-100 font-mono font-bold">${selectedLead.budget.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Headcount</span>
                  <span className="text-slate-200 font-medium">{selectedLead.company_size}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Buyer Seniority</span>
                  <span className="text-slate-200 font-medium">{selectedLead.decision_maker_seniority}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Procurement Timeline</span>
                  <span className="text-slate-200 font-medium">{selectedLead.timeline}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Intent Score</span>
                  <span className="text-slate-200 font-mono font-semibold">{selectedLead.intent_score}/100</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5">
                  <span className="text-slate-500 block">Tech Stack Match</span>
                  <span className="text-slate-200 font-medium">{selectedLead.tech_stack_match ? 'Yes (Verified)' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Feature Attribution List */}
            {selectedLead.feature_importance && selectedLead.feature_importance.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Feature Weight Contribution
                </h3>
                <div className="space-y-2">
                  {selectedLead.feature_importance.map((f) => (
                    <div
                      key={f.feature}
                      className="p-2.5 rounded-xl bg-slate-900/30 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">{f.feature}</div>
                        <div className="text-[11px] text-slate-400">{f.description}</div>
                      </div>
                      <div className="text-right font-mono">
                        <span
                          className={`font-bold ${
                            f.impact === 'positive'
                              ? 'text-emerald-400'
                              : f.impact === 'negative'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          +{f.contribution} pts
                        </span>
                        <div className="text-[10px] text-slate-500">{(f.weight * 100).toFixed(0)}% weight</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={selectedLead.status}
                  disabled={updateLoading}
                  onChange={(e) => handleStatusUpdate(e.target.value as LeadStatus)}
                  className="px-2.5 py-1.5 text-xs bg-slate-950 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="New">New</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="Disqualified">Disqualified</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Won">Won</option>
                </select>
              </div>

              <button
                onClick={() => setLeadToDelete(selectedLead)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition-colors"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl space-y-4 border border-rose-500/30">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Delete Lead Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete lead{' '}
              <strong className="text-white">{leadToDelete.name}</strong> ({leadToDelete.company})?
              This action will be synchronized with the database and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={confirmDeleteLead}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
