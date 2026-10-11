import { FeatureContribution, Lead, PriorityTier, LeadStatus, ReviewDecision } from '../types';

export interface ScoreInputs {
  budget: number;
  decision_maker_seniority: string;
  timeline: string;
  company_size: string;
  industry: string;
  intent_score: number;
  tech_stack_match: boolean;
}

export function computeLeadScore(inputs: ScoreInputs, customWeights?: Record<string, number>): {
  score: number;
  priority: PriorityTier;
  status: LeadStatus;
  explanation: string;
  feature_importance: FeatureContribution[];
  needsReviewReason?: string;
} {
  const budget = Number(inputs.budget) || 0;
  const intent = Math.min(100, Math.max(0, Number(inputs.intent_score) || 50));
  const seniority = inputs.decision_maker_seniority || 'Manager / Lead';
  const timeline = inputs.timeline || '3-6 months';
  const companySize = inputs.company_size || '11-50';
  const industry = inputs.industry || 'Other';
  const techMatch = Boolean(inputs.tech_stack_match);

  // 1. Budget Score (Max 25 pts)
  let budgetScore = 4;
  let budgetImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let budgetDesc = `Annual budget of $${budget.toLocaleString()}`;
  if (budget >= 100000) {
    budgetScore = 25;
    budgetImpact = 'positive';
    budgetDesc = `Enterprise tier budget ($${budget.toLocaleString()}) strongly supports qualification`;
  } else if (budget >= 50000) {
    budgetScore = 20;
    budgetImpact = 'positive';
    budgetDesc = `Mid-market budget ($${budget.toLocaleString()}) well above ACV threshold`;
  } else if (budget >= 25000) {
    budgetScore = 14;
    budgetImpact = 'neutral';
    budgetDesc = `Standard budget ($${budget.toLocaleString()}) meets baseline criteria`;
  } else if (budget >= 10000) {
    budgetScore = 8;
    budgetImpact = 'negative';
    budgetDesc = `Low budget ($${budget.toLocaleString()}) below standard deal size`;
  } else {
    budgetScore = 2;
    budgetImpact = 'negative';
    budgetDesc = `Budget ($${budget.toLocaleString()}) insufficient for enterprise tier`;
  }

  // 2. Decision Maker Seniority (Max 20 pts)
  let seniorityScore = 6;
  let seniorityImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let seniorityDesc = `${seniority} buyer role`;
  if (seniority === 'C-Suite / VP') {
    seniorityScore = 20;
    seniorityImpact = 'positive';
    seniorityDesc = `Executive decision-making authority (C-Suite / VP)`;
  } else if (seniority === 'Director') {
    seniorityScore = 16;
    seniorityImpact = 'positive';
    seniorityDesc = `Director-level budget approval authority`;
  } else if (seniority === 'Manager / Lead') {
    seniorityScore = 10;
    seniorityImpact = 'neutral';
    seniorityDesc = `Team lead/manager with evaluation influence`;
  } else {
    seniorityScore = 4;
    seniorityImpact = 'negative';
    seniorityDesc = `Individual contributor without direct signing authority`;
  }

  // 3. Timeline / Urgency (Max 15 pts)
  let timelineScore = 6;
  let timelineImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let timelineDesc = `Purchase window: ${timeline}`;
  if (timeline.includes('Immediate') || timeline.includes('<1 mo')) {
    timelineScore = 15;
    timelineImpact = 'positive';
    timelineDesc = `High urgency: active project procurement (< 1 mo)`;
  } else if (timeline.includes('1-3 months')) {
    timelineScore = 12;
    timelineImpact = 'positive';
    timelineDesc = `Near-term buying cycle (1-3 months)`;
  } else if (timeline.includes('3-6 months')) {
    timelineScore = 7;
    timelineImpact = 'neutral';
    timelineDesc = `Mid-term evaluation timeline (3-6 months)`;
  } else {
    timelineScore = 2;
    timelineImpact = 'negative';
    timelineDesc = `Passive or exploratory horizon (> 6 months)`;
  }

  // 4. Company Size (Max 15 pts)
  let sizeScore = 5;
  let sizeImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let sizeDesc = `Organization size: ${companySize} employees`;
  if (companySize === '1000+' || companySize === '201-1000') {
    sizeScore = 15;
    sizeImpact = 'positive';
    sizeDesc = `Large enterprise scale (${companySize} headcount)`;
  } else if (companySize === '51-200') {
    sizeScore = 11;
    sizeImpact = 'positive';
    sizeDesc = `Scaling mid-market company (${companySize} headcount)`;
  } else if (companySize === '11-50') {
    sizeScore = 7;
    sizeImpact = 'neutral';
    sizeDesc = `Growth stage startup (${companySize} headcount)`;
  } else {
    sizeScore = 3;
    sizeImpact = 'negative';
    sizeDesc = `Early-stage team (${companySize} headcount)`;
  }

  // 5. Industry Fit (Max 10 pts)
  let industryScore = 4;
  let industryImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let industryDesc = `Industry segment: ${industry}`;
  const highFitIndustries = ['Fintech', 'Cybersecurity', 'Cloud & DevOps', 'AI & Data Tools'];
  const medFitIndustries = ['Healthcare SaaS', 'E-commerce'];
  if (highFitIndustries.includes(industry)) {
    industryScore = 10;
    industryImpact = 'positive';
    industryDesc = `Prime target vertical (${industry}) with high historical conversion`;
  } else if (medFitIndustries.includes(industry)) {
    industryScore = 7;
    industryImpact = 'neutral';
    industryDesc = `Compatible vertical (${industry}) with moderate product fit`;
  } else {
    industryScore = 4;
    industryImpact = 'negative';
    industryDesc = `Non-core vertical (${industry}) requiring tailored positioning`;
  }

  // 6. Intent Score (Max 10 pts)
  const intentScoreCalculated = Math.round((intent / 100) * 10);
  let intentImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (intent >= 75) intentImpact = 'positive';
  else if (intent < 45) intentImpact = 'negative';
  const intentDesc = `Digital intent rating of ${intent}/100`;

  // 7. Tech Stack Match (Max 5 pts)
  const techScore = techMatch ? 5 : 1;
  const techImpact = techMatch ? 'positive' : 'neutral';
  const techDesc = techMatch ? `Verified native integration stack compatibility` : `No direct stack overlap identified`;

  // Total raw score
  let totalScore = budgetScore + seniorityScore + timelineScore + sizeScore + industryScore + intentScoreCalculated + techScore;
  totalScore = Math.min(100, Math.max(5, Math.round(totalScore)));

  // Feature breakdown
  const feature_importance: FeatureContribution[] = [
    { feature: 'Annual Budget', weight: 0.25, contribution: budgetScore, impact: budgetImpact, description: budgetDesc },
    { feature: 'Buyer Authority', weight: 0.20, contribution: seniorityScore, impact: seniorityImpact, description: seniorityDesc },
    { feature: 'Timeline Urgency', weight: 0.15, contribution: timelineScore, impact: timelineImpact, description: timelineDesc },
    { feature: 'Organization Size', weight: 0.15, contribution: sizeScore, impact: sizeImpact, description: sizeDesc },
    { feature: 'Vertical Fit', weight: 0.10, contribution: industryScore, impact: industryImpact, description: industryDesc },
    { feature: 'Intent Signals', weight: 0.10, contribution: intentScoreCalculated, impact: intentImpact, description: intentDesc },
    { feature: 'Tech Match', weight: 0.05, contribution: techScore, impact: techImpact, description: techDesc },
  ];

  // Priority classification
  let priority: PriorityTier = 'Low';
  let status: LeadStatus = 'New';
  let needsReviewReason: string | undefined;

  // Conflict detection for Review Queue
  const isHighBudgetLowAuthority = budget >= 50000 && (seniority === 'Individual Contributor' || seniority === 'Manager / Lead');
  const isBorderlineScore = totalScore >= 50 && totalScore <= 68;
  const isHighIntentLongTimeline = intent >= 80 && timeline.includes('>6 mo');

  if (totalScore >= 75) {
    priority = 'High';
    status = 'Qualified';
  } else if (totalScore >= 50) {
    priority = 'Medium';
    if (isBorderlineScore || isHighBudgetLowAuthority || isHighIntentLongTimeline) {
      status = 'Needs Review';
      if (isHighBudgetLowAuthority) {
        needsReviewReason = `High budget ($${budget.toLocaleString()}) requires verification with ${seniority} buyer.`;
      } else if (isHighIntentLongTimeline) {
        needsReviewReason = `Strong intent (${intent}/100) conflicts with distant timeline (${timeline}).`;
      } else {
        needsReviewReason = `Score in borderline corridor (${totalScore}/100). Manual qualification recommended.`;
      }
    } else {
      status = 'New';
    }
  } else {
    priority = 'Low';
    status = 'Disqualified';
  }

  // Generate clear ML explanation
  let explanation = '';
  if (totalScore >= 75) {
    explanation = `High qualification score (${totalScore}/100). Strong driver is ${budgetImpact === 'positive' ? 'budget capacity' : 'vertical affinity'} paired with ${seniority} decision authority and near-term procurement readiness. Recommended for immediate executive outreach.`;
  } else if (status === 'Needs Review') {
    explanation = `Moderate qualification score (${totalScore}/100). Automated heuristics flagged for human verification: ${needsReviewReason || 'Borderline metric balance requires sales director assessment.'}`;
  } else if (totalScore >= 50) {
    explanation = `Standard qualification score (${totalScore}/100). Moderate profile showing viable opportunity in ${industry}, but timeline (${timeline}) suggests mid-cycle nurturing.`;
  } else {
    explanation = `Low qualification score (${totalScore}/100). Constrained by sub-threshold budget ($${budget.toLocaleString()}) and limited decision maker authority. Recommended for automated nurture flow.`;
  }

  return {
    score: totalScore,
    priority,
    status,
    explanation,
    feature_importance,
    needsReviewReason,
  };
}
