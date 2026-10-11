# LeadMatrix — Sales Lead Qualification Engine

LeadMatrix is an enterprise AI/ML sales lead qualification platform featuring real-time predictive scoring, automated review queues, statistical drift monitoring, bulk CSV processing, and Supabase integration.

---

## 1. Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide icons.
- **Backend API Engine**: Node.js Express server (`server.ts`) with Vite dev middleware for development and static distribution serving for production.
- **Python FastAPI Reference**: Provided in `/backend_fastapi/main.py` for Python runtime environments.
- **Persistent Database**:
  - Direct integration with **Supabase** via PostgreSQL tables (`leads` and `model_audit`).
  - Automatic fallback to high-performance local persistent store (`/data/leads.json`) when Supabase credentials are not provided.
- **Machine Learning Core**: Ensemble scoring engine combining XGBoost-style feature weighting, decision-tree heuristics, and SHAP-aligned feature attribution.

---

## 2. Key Features

1. **Collapsible Left Sidebar Layout**:
   - Single fixed, collapsible sidebar with all eight primary navigation views:
     1. Dashboard
     2. Leads Directory
     3. Add Lead
     4. Bulk Upload
     5. Analytics & Models
     6. Review Queue
     7. Drift Monitor
     8. Settings
   - Mobile-responsive slide-out navigation drawer.
2. **Cosmic Galaxy Background & Cursor Stars**:
   - Multi-layered canvas-based midnight galaxy with twinkling multi-colored stars (white, red, yellow, pink, purple, blue, cyan, orange, gold).
   - Cursor-following star trail with smooth physics and fade-out animations.
   - Respects `prefers-reduced-motion` and never obstructs user clicks or forms.
3. **Real-Time ML Lead Scoring**:
   - Scores leads from 0 to 100 with qualification priority tiers (High, Medium, Low).
   - Evaluates budget capacity, buyer seniority authority, buying window timeline, organization headcount, vertical affinity, and digital intent signals.
   - Transparent feature attribution breakdown for every scored opportunity.
4. **Human-in-the-Loop Review Queue**:
   - Detects borderline cases (e.g., scores in the 50–68 range, or high budgets with junior titles).
   - Allows sales managers to approve, disqualify, or override scores with recorded auditor notes.
5. **Statistical Drift Monitor**:
   - Tracks Population Stability Index (PSI) between baseline and incoming qualification windows.
   - Detects feature-level shifts in budget, intent, and executive ratios.
   - Displays clear warning when sample size is insufficient (< 5 records).
6. **Bulk CSV Processing**:
   - Drag-and-drop CSV upload with column auto-mapping and row validation.
   - Batch scoring with duplicate prevention and download sample template.

---

## 3. Environment Variables

Configure these variables in your deployment environment or `.env` file (refer to `.env.example`):

```bash
# Host URL where app is deployed
APP_URL="https://your-app-domain.com"

# Supabase Credentials (Optional for cloud sync; local persistent storage is active by default)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Gemini API Key (Optional AI services)
GEMINI_API_KEY="your-gemini-key"
```

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack dev server (starts on http://localhost:3000)
npm run dev

# 3. Type check & Lint
npm run lint

# 4. Production build
npm run build

# 5. Start production server
npm start
```

---

## 5. Supabase SQL Setup

Run the SQL script located in `src/db/schema.sql` in your Supabase SQL Editor to provision the tables:
- `public.leads`
- `public.model_audit`
- Row-Level Security policies and indexes.

---

## 6. GitHub & Vercel Deployment Guide

### A. Vercel Deployment (Frontend SPA)
1. In Vercel Project Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### B. Full-Stack / Cloud Run / Railway / Render Deployment
1. Set start script: `node server.ts` or `tsx server.ts`.
2. Port: `3000` (or `$PORT`).
3. Set `NODE_ENV=production`.
