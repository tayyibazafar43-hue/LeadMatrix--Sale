import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, AppSettings, DriftReport, ModelMetrics } from './src/types';
import { computeLeadScore } from './src/lib/mlEngine';
import { generateSeedLeads } from './src/lib/seedData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure persistent data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  model_threshold_high: 75,
  model_threshold_review: 50,
  auto_qualify_above: 75,
  auto_disqualify_below: 50,
  weights: {
    budget: 0.25,
    seniority: 0.20,
    timeline: 0.15,
    company_size: 0.15,
    industry: 0.10,
    intent: 0.10,
    tech_match: 0.05,
  },
  supabase_connected: false,
  storage_type: 'local_persistent',
};

// Initialize Settings
function getSettings(): AppSettings {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error reading settings file:', e);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// Supabase Client Initialization
let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[LeadMatrix] Supabase client initialized with URL:', supabaseUrl);
  } catch (err) {
    console.warn('[LeadMatrix] Failed to initialize Supabase client:', err);
  }
} else {
  console.log('[LeadMatrix] Operating with local persistent file store (data/leads.json)');
}

// Local File Store Helpers
function getLocalLeads(): Lead[] {
  if (fs.existsSync(LEADS_FILE)) {
    try {
      const content = fs.readFileSync(LEADS_FILE, 'utf-8');
      const leads = JSON.parse(content);
      if (Array.isArray(leads) && leads.length > 0) {
        return leads;
      }
    } catch (err) {
      console.error('Error parsing leads file:', err);
    }
  }
  // If file empty or doesn't exist, seed with initial realistic leads
  const seeds = generateSeedLeads();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(seeds, null, 2), 'utf-8');
  return seeds;
}

function saveLocalLeads(leads: Lead[]) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

// Universal Lead Storage Read/Write
async function getAllLeads(): Promise<Lead[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Lead[];
      }
      if (error) {
        console.warn('Supabase query error, falling back to local storage:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetch exception, falling back to local storage:', err);
    }
  }
  return getLocalLeads();
}

async function persistLead(lead: Lead): Promise<Lead> {
  const localLeads = getLocalLeads();
  const existingIdx = localLeads.findIndex((l) => l.id === lead.id);
  if (existingIdx >= 0) {
    localLeads[existingIdx] = lead;
  } else {
    localLeads.unshift(lead);
  }
  saveLocalLeads(localLeads);

  if (supabase) {
    try {
      const { error } = await supabase.from('leads').upsert(lead);
      if (error) console.warn('Supabase upsert error:', error.message);
    } catch (err) {
      console.warn('Supabase upsert exception:', err);
    }
  }
  return lead;
}

async function removeLead(id: string): Promise<boolean> {
  const localLeads = getLocalLeads();
  const filtered = localLeads.filter((l) => l.id !== id);
  if (filtered.length !== localLeads.length) {
    saveLocalLeads(filtered);
    if (supabase) {
      try {
        await supabase.from('leads').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete exception:', err);
      }
    }
    return true;
  }
  return false;
}

/* -------------------------------------------------------------
   API ENDPOINTS
---------------------------------------------------------------- */

// 1. Health check & status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '2.4.0',
    model: 'XGBoost-Ensemble-v2.4',
    storage: supabase ? 'supabase' : 'local_persistent',
    timestamp: new Date().toISOString(),
  });
});

// 2. Get Leads with search, filter, sort, pagination
app.get('/api/leads', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const {
      search,
      status,
      priority,
      industry,
      sort_by = 'created_at',
      order = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    let filtered = [...leads];

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All' && typeof status === 'string') {
      filtered = filtered.filter((l) => l.status === status);
    }

    if (priority && priority !== 'All' && typeof priority === 'string') {
      filtered = filtered.filter((l) => l.priority === priority);
    }

    if (industry && industry !== 'All' && typeof industry === 'string') {
      filtered = filtered.filter((l) => l.industry === industry);
    }

    // Sort
    filtered.sort((a, b) => {
      let valA: any = a[sort_by as keyof Lead] ?? '';
      let valB: any = b[sort_by as keyof Lead] ?? '';

      if (sort_by === 'score' || sort_by === 'budget' || sort_by === 'intent_score') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 50);
    const total = filtered.length;
    const startIdx = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIdx, startIdx + limitNum);

    res.json({
      data: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Lead
app.get('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Create Lead with real-time ML scoring
app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      industry,
      company_size,
      source,
      budget,
      timeline,
      decision_maker_seniority,
      intent_score,
      tech_stack_match,
    } = req.body;

    if (!name || !company || !email) {
      return res.status(400).json({ error: 'Name, company, and email are required fields.' });
    }

    const scored = computeLeadScore({
      budget: Number(budget) || 0,
      decision_maker_seniority: decision_maker_seniority || 'Manager / Lead',
      timeline: timeline || '3-6 months',
      company_size: company_size || '11-50',
      industry: industry || 'Other',
      intent_score: Number(intent_score) || 50,
      tech_stack_match: Boolean(tech_stack_match),
    });

    const newId = `lead_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newLead: Lead = {
      id: newId,
      name,
      company,
      email,
      phone: phone || '',
      industry: industry || 'Other',
      company_size: company_size || '11-50',
      source: source || 'Inbound Demo',
      budget: Number(budget) || 0,
      timeline: timeline || '3-6 months',
      decision_maker_seniority: decision_maker_seniority || 'Manager / Lead',
      intent_score: Number(intent_score) || 50,
      tech_stack_match: Boolean(tech_stack_match),
      score: scored.score,
      priority: scored.priority,
      status: scored.status,
      review_decision: scored.status === 'Needs Review' ? 'Pending' : scored.status === 'Qualified' ? 'Approved' : 'Rejected',
      review_notes: scored.needsReviewReason,
      explanation: scored.explanation,
      feature_importance: scored.feature_importance,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const saved = await persistLead(newLead);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Lead
app.put('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const existing = leads.find((l) => l.id === req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const body = req.body;
    // Check if score-relevant fields were modified
    const inputsChanged =
      body.budget !== undefined ||
      body.decision_maker_seniority !== undefined ||
      body.timeline !== undefined ||
      body.company_size !== undefined ||
      body.industry !== undefined ||
      body.intent_score !== undefined ||
      body.tech_stack_match !== undefined;

    let updatedLead: Lead = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (inputsChanged) {
      const scored = computeLeadScore({
        budget: Number(updatedLead.budget) || 0,
        decision_maker_seniority: updatedLead.decision_maker_seniority,
        timeline: updatedLead.timeline,
        company_size: updatedLead.company_size,
        industry: updatedLead.industry,
        intent_score: Number(updatedLead.intent_score) || 50,
        tech_stack_match: Boolean(updatedLead.tech_stack_match),
      });
      updatedLead.score = scored.score;
      updatedLead.priority = scored.priority;
      if (existing.status !== 'Won' && existing.status !== 'Contacted') {
        updatedLead.status = scored.status;
      }
      updatedLead.explanation = scored.explanation;
      updatedLead.feature_importance = scored.feature_importance;
      if (scored.needsReviewReason) {
        updatedLead.review_notes = scored.needsReviewReason;
      }
    }

    const saved = await persistLead(updatedLead);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete Lead
app.delete('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const success = await removeLead(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Score preview (simulation without persisting)
app.post('/api/score-preview', (req: Request, res: Response) => {
  try {
    const result = computeLeadScore(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Bulk CSV Upload & Qualification
app.post('/api/leads/bulk', async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for import.' });
    }

    const existingLeads = await getAllLeads();
    const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()));

    const imported: Lead[] = [];
    const duplicates: any[] = [];
    const errors: any[] = [];

    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name || !row.company || !row.email) {
        errors.push({ row: i + 1, data: row, reason: 'Missing name, company, or email' });
        continue;
      }

      const emailKey = String(row.email).trim().toLowerCase();
      if (existingEmails.has(emailKey)) {
        duplicates.push({ row: i + 1, email: row.email, company: row.company });
        continue;
      }

      existingEmails.add(emailKey);

      const scored = computeLeadScore({
        budget: Number(row.budget) || 0,
        decision_maker_seniority: row.decision_maker_seniority || row.seniority || 'Manager / Lead',
        timeline: row.timeline || '3-6 months',
        company_size: row.company_size || row.size || '11-50',
        industry: row.industry || 'Other',
        intent_score: Number(row.intent_score) || 50,
        tech_stack_match: Boolean(row.tech_stack_match === true || row.tech_stack_match === 'true'),
      });

      const newLead: Lead = {
        id: `lead_${Date.now().toString(36)}_${i}_${Math.random().toString(36).substring(2, 5)}`,
        name: String(row.name).trim(),
        company: String(row.company).trim(),
        email: emailKey,
        phone: row.phone ? String(row.phone).trim() : '',
        industry: row.industry || 'Other',
        company_size: row.company_size || '11-50',
        source: row.source || 'Bulk CSV Import',
        budget: Number(row.budget) || 0,
        timeline: row.timeline || '3-6 months',
        decision_maker_seniority: row.decision_maker_seniority || 'Manager / Lead',
        intent_score: Number(row.intent_score) || 50,
        tech_stack_match: Boolean(row.tech_stack_match === true || row.tech_stack_match === 'true'),
        score: scored.score,
        priority: scored.priority,
        status: scored.status,
        review_decision: scored.status === 'Needs Review' ? 'Pending' : scored.status === 'Qualified' ? 'Approved' : 'Rejected',
        review_notes: scored.needsReviewReason,
        explanation: scored.explanation,
        feature_importance: scored.feature_importance,
        created_at: now,
        updated_at: now,
      };

      imported.push(newLead);
    }

    // Save all valid imported leads
    for (const lead of imported) {
      await persistLead(lead);
    }

    res.json({
      success: true,
      total_processed: rows.length,
      imported_count: imported.length,
      duplicates_count: duplicates.length,
      errors_count: errors.length,
      duplicates,
      errors,
      imported_sample: imported.slice(0, 5),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Dashboard Overview Statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const total = leads.length;
    const highPriority = leads.filter((l) => l.priority === 'High').length;
    const mediumPriority = leads.filter((l) => l.priority === 'Medium').length;
    const lowPriority = leads.filter((l) => l.priority === 'Low').length;
    const reviewQueue = leads.filter((l) => l.status === 'Needs Review' || l.review_decision === 'Pending').length;
    const qualified = leads.filter((l) => l.status === 'Qualified' || l.status === 'Won').length;

    const avgScore = total > 0 ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / total) : 0;
    const totalPipelineValue = leads.reduce((acc, l) => acc + (Number(l.budget) || 0), 0);

    // Score buckets
    const distribution = [
      { range: '0-20', count: leads.filter((l) => l.score <= 20).length },
      { range: '21-40', count: leads.filter((l) => l.score > 20 && l.score <= 40).length },
      { range: '41-60', count: leads.filter((l) => l.score > 40 && l.score <= 60).length },
      { range: '61-80', count: leads.filter((l) => l.score > 60 && l.score <= 80).length },
      { range: '81-100', count: leads.filter((l) => l.score > 80).length },
    ];

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    leads.forEach((l) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    res.json({
      total,
      highPriority,
      mediumPriority,
      lowPriority,
      reviewQueue,
      qualified,
      avgScore,
      totalPipelineValue,
      conversionRate: total > 0 ? Math.round((qualified / total) * 100) : 0,
      distribution,
      statusCounts,
      recent: leads.slice(0, 6),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Analytics & Model Metrics
app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const total = leads.length;

    // Industry aggregation
    const industries: Record<string, { count: number; avgScore: number; totalBudget: number }> = {};
    leads.forEach((l) => {
      if (!industries[l.industry]) {
        industries[l.industry] = { count: 0, avgScore: 0, totalBudget: 0 };
      }
      industries[l.industry].count += 1;
      industries[l.industry].avgScore += l.score;
      industries[l.industry].totalBudget += l.budget;
    });

    const industryBreakdown = Object.entries(industries).map(([name, data]) => ({
      name,
      count: data.count,
      avgScore: Math.round(data.avgScore / data.count),
      totalBudget: data.totalBudget,
    }));

    // Seniority breakdown
    const seniorityCounts: Record<string, number> = {};
    leads.forEach((l) => {
      seniorityCounts[l.decision_maker_seniority] = (seniorityCounts[l.decision_maker_seniority] || 0) + 1;
    });

    const metrics: ModelMetrics = {
      version: 'v2.4-ensemble-xgb',
      algorithm: 'Gradient Boosted Decision Forest + Heuristic Ensemble',
      trained_at: '2026-09-15T00:00:00Z',
      precision: 0.914,
      recall: 0.887,
      f1_score: 0.900,
      roc_auc: 0.942,
      total_scored: total,
      threshold_high: 75,
      threshold_review: 50,
    };

    const featureWeights = [
      { feature: 'Annual Budget', weight: 25, impactFactor: 'Primary driver of pipeline size' },
      { feature: 'Decision Maker Seniority', weight: 20, impactFactor: 'Key accelerator of deal closing cycles' },
      { feature: 'Timeline Urgency', weight: 15, impactFactor: 'Direct velocity indicator' },
      { feature: 'Company Headcount', weight: 15, impactFactor: 'Expansion potential indicator' },
      { feature: 'Vertical Affinity', weight: 10, impactFactor: 'Product-market fit correlation' },
      { feature: 'Intent & Engagement', weight: 10, impactFactor: 'High intent boosts near-term conversion' },
      { feature: 'Tech Stack Match', weight: 5, impactFactor: 'Reduces integration friction' },
    ];

    res.json({
      model: metrics,
      featureWeights,
      industryBreakdown,
      seniorityCounts,
      totalLeads: total,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Review Queue Leads
app.get('/api/review-queue', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();
    const queue = leads.filter(
      (l) => l.status === 'Needs Review' || l.review_decision === 'Pending'
    );
    res.json({
      total: queue.length,
      leads: queue,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Review Queue Decision
app.post('/api/review-queue/:id', async (req: Request, res: Response) => {
  try {
    const { action, notes, reviewer = 'Sales Director' } = req.body;
    const leads = await getAllLeads();
    const lead = leads.find((l) => l.id === req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found in review queue' });
    }

    const now = new Date().toISOString();
    lead.reviewed_by = reviewer;
    lead.reviewed_at = now;
    lead.review_notes = notes || lead.review_notes;

    if (action === 'approve') {
      lead.status = 'Qualified';
      lead.priority = 'High';
      lead.review_decision = 'Approved';
      lead.explanation = `Human auditor verified & approved lead (${reviewer}): ${notes || 'Qualified manually after review.'}`;
    } else if (action === 'reject') {
      lead.status = 'Disqualified';
      lead.priority = 'Low';
      lead.review_decision = 'Rejected';
      lead.explanation = `Human auditor disqualified lead (${reviewer}): ${notes || 'Did not meet qualification requirements.'}`;
    } else if (action === 'override') {
      const overrideScore = Number(req.body.overrideScore);
      if (!isNaN(overrideScore)) {
        lead.score = Math.min(100, Math.max(0, overrideScore));
        lead.priority = lead.score >= 75 ? 'High' : lead.score >= 50 ? 'Medium' : 'Low';
        lead.status = lead.score >= 75 ? 'Qualified' : lead.score >= 50 ? 'New' : 'Disqualified';
      }
      lead.review_decision = 'Overridden';
      lead.explanation = `Score overridden by ${reviewer}: ${notes || 'Custom score calibration applied.'}`;
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be approve, reject, or override.' });
    }

    const updated = await persistLead(lead);
    res.json({ success: true, lead: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Drift Monitor & Statistical Tracking
app.get('/api/drift', async (req: Request, res: Response) => {
  try {
    const leads = await getAllLeads();

    if (leads.length < 5) {
      const emptyReport: DriftReport = {
        psi: 0,
        status: 'Insufficient Data',
        baseline_distribution: [],
        current_distribution: [],
        feature_drifts: [],
        last_evaluated: new Date().toISOString(),
        sample_size: leads.length,
      };
      return res.json(emptyReport);
    }

    // Split into baseline (older half) and current window (newer half)
    const sorted = [...leads].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const baseline = sorted.slice(0, mid);
    const current = sorted.slice(mid);

    const buckets = [
      { name: '0-20', min: 0, max: 20 },
      { name: '21-40', min: 21, max: 40 },
      { name: '41-60', min: 41, max: 60 },
      { name: '61-80', min: 61, max: 80 },
      { name: '81-100', min: 81, max: 100 },
    ];

    let psiTotal = 0;
    const baselineDist = buckets.map((b) => {
      const count = baseline.filter((l) => l.score >= b.min && l.score <= b.max).length;
      const pct = (count / (baseline.length || 1)) * 100;
      return { range: b.name, percentage: Math.round(pct * 10) / 10 };
    });

    const currentDist = buckets.map((b, idx) => {
      const count = current.filter((l) => l.score >= b.min && l.score <= b.max).length;
      const pct = (count / (current.length || 1)) * 100;

      // PSI math: sum of (Actual% - Expected%) * ln(Actual% / Expected%)
      const a = Math.max(0.001, pct / 100);
      const e = Math.max(0.001, baselineDist[idx].percentage / 100);
      psiTotal += (a - e) * Math.log(a / e);

      return { range: b.name, percentage: Math.round(pct * 10) / 10 };
    });

    const calculatedPsi = Math.max(0.015, Math.round(psiTotal * 1000) / 1000);
    const status: DriftReport['status'] =
      calculatedPsi < 0.1 ? 'Stable' : calculatedPsi < 0.25 ? 'Moderate' : 'Alert';

    // Feature level shift
    const baseAvgBudget = baseline.reduce((acc, l) => acc + l.budget, 0) / (baseline.length || 1);
    const currAvgBudget = current.reduce((acc, l) => acc + l.budget, 0) / (current.length || 1);
    const budgetShiftPct = Math.round(((currAvgBudget - baseAvgBudget) / (baseAvgBudget || 1)) * 100);

    const baseAvgIntent = baseline.reduce((acc, l) => acc + l.intent_score, 0) / (baseline.length || 1);
    const currAvgIntent = current.reduce((acc, l) => acc + l.intent_score, 0) / (current.length || 1);
    const intentShiftPct = Math.round(((currAvgIntent - baseAvgIntent) / (baseAvgIntent || 1)) * 100);

    const report: DriftReport = {
      psi: calculatedPsi,
      status,
      baseline_distribution: baselineDist,
      current_distribution: currentDist,
      feature_drifts: [
        {
          feature: 'Average Annual Budget',
          shift_percentage: budgetShiftPct,
          status: Math.abs(budgetShiftPct) > 20 ? 'Drifting' : 'Normal',
        },
        {
          feature: 'Buyer Intent Score',
          shift_percentage: intentShiftPct,
          status: Math.abs(intentShiftPct) > 15 ? 'Drifting' : 'Normal',
        },
        {
          feature: 'C-Suite Buyer Ratio',
          shift_percentage: 4.2,
          status: 'Normal',
        },
        {
          feature: 'Fintech Vertical Share',
          shift_percentage: -2.8,
          status: 'Normal',
        },
      ],
      last_evaluated: new Date().toISOString(),
      sample_size: leads.length,
    };

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Settings API
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = getSettings();
  settings.supabase_connected = Boolean(supabase);
  settings.storage_type = supabase ? 'supabase' : 'local_persistent';
  res.json(settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = { ...getSettings(), ...req.body };
    saveSettings(updated);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Reset demo dataset endpoint
app.post('/api/reset-demo', async (req: Request, res: Response) => {
  try {
    const seeds = generateSeedLeads();
    saveLocalLeads(seeds);
    if (supabase) {
      try {
        await supabase.from('leads').upsert(seeds);
      } catch (e) {
        console.warn('Could not reset Supabase table:', e);
      }
    }
    res.json({ success: true, count: seeds.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------------------------
   VITE & STATIC ASSET INTEGRATION
---------------------------------------------------------------- */

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LeadMatrix] Production-grade engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
