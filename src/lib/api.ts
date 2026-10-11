import { Lead, AppSettings, DriftReport, ModelMetrics } from '../types';

export interface LeadsResponse {
  data: Lead[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StatsResponse {
  total: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  reviewQueue: number;
  qualified: number;
  avgScore: number;
  totalPipelineValue: number;
  conversionRate: number;
  distribution: { range: string; count: number }[];
  statusCounts: Record<string, number>;
  recent: Lead[];
}

export interface AnalyticsResponse {
  model: ModelMetrics;
  featureWeights: { feature: string; weight: number; impactFactor: string }[];
  industryBreakdown: { name: string; count: number; avgScore: number; totalBudget: number }[];
  seniorityCounts: Record<string, number>;
  totalLeads: number;
}

export async function fetchLeads(params: {
  search?: string;
  status?: string;
  priority?: string;
  industry?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
} = {}): Promise<LeadsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.industry) query.set('industry', params.industry);
  if (params.sort_by) query.set('sort_by', params.sort_by);
  if (params.order) query.set('order', params.order);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`/api/leads?${query.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch leads: ${res.statusText}`);
  return res.json();
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`);
  if (!res.ok) throw new Error(`Lead not found`);
  return res.json();
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create lead');
  }
  return res.json();
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update lead');
  }
  return res.json();
}

export async function deleteLead(id: string): Promise<boolean> {
  const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete lead');
  return true;
}

export async function previewScore(inputs: any) {
  const res = await fetch('/api/score-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) throw new Error('Failed to preview score');
  return res.json();
}

export async function bulkUploadLeads(rows: any[]) {
  const res = await fetch('/api/leads/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to process bulk upload');
  }
  return res.json();
}

export async function fetchDashboardStats(): Promise<StatsResponse> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to fetch analytics data');
  return res.json();
}

export async function fetchReviewQueue(): Promise<{ total: number; leads: Lead[] }> {
  const res = await fetch('/api/review-queue');
  if (!res.ok) throw new Error('Failed to fetch review queue');
  return res.json();
}

export async function submitReviewDecision(
  id: string,
  action: 'approve' | 'reject' | 'override',
  notes?: string,
  overrideScore?: number
): Promise<{ success: boolean; lead: Lead }> {
  const res = await fetch(`/api/review-queue/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes, overrideScore }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to record review decision');
  }
  return res.json();
}

export async function fetchDriftReport(): Promise<DriftReport> {
  const res = await fetch('/api/drift');
  if (!res.ok) throw new Error('Failed to fetch drift report');
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch application settings');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  const json = await res.json();
  return json.settings;
}

export async function resetDemoDataset(): Promise<number> {
  const res = await fetch('/api/reset-demo', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset dataset');
  const json = await res.json();
  return json.count;
}
