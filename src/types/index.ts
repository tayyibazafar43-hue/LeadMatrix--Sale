export type PriorityTier = 'High' | 'Medium' | 'Low';

export type LeadStatus = 'New' | 'Qualified' | 'Needs Review' | 'Disqualified' | 'Contacted' | 'Won';

export type ReviewDecision = 'Pending' | 'Approved' | 'Rejected' | 'Overridden';

export interface FeatureContribution {
  feature: string;
  weight: number;
  contribution: number;
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry: string;
  company_size: string;
  source: string;
  budget: number;
  timeline: string;
  decision_maker_seniority: string;
  intent_score: number;
  tech_stack_match: boolean;
  score: number;
  priority: PriorityTier;
  status: LeadStatus;
  review_decision: ReviewDecision;
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  explanation: string;
  feature_importance: FeatureContribution[];
  created_at: string;
  updated_at: string;
}

export interface ModelMetrics {
  version: string;
  algorithm: string;
  trained_at: string;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  total_scored: number;
  threshold_high: number;
  threshold_review: number;
}

export interface DriftReport {
  psi: number;
  status: 'Stable' | 'Moderate' | 'Alert' | 'Insufficient Data';
  baseline_distribution: { range: string; percentage: number }[];
  current_distribution: { range: string; percentage: number }[];
  feature_drifts: {
    feature: string;
    shift_percentage: number;
    status: 'Normal' | 'Drifting';
  }[];
  last_evaluated: string;
  sample_size: number;
}

export interface AppSettings {
  model_threshold_high: number;
  model_threshold_review: number;
  auto_qualify_above: number;
  auto_disqualify_below: number;
  weights: {
    budget: number;
    seniority: number;
    timeline: number;
    company_size: number;
    industry: number;
    intent: number;
    tech_match: number;
  };
  supabase_connected: boolean;
  storage_type: 'supabase' | 'local_persistent';
}
