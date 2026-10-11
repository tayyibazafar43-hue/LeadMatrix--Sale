-- LeadMatrix Supabase Database Schema
-- Run this in your Supabase SQL Editor if you are connecting your own Supabase project.

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create 'leads' table
create table if not exists public.leads (
    id text primary key default ('lead_' || substr(md5(random()::text), 1, 8)),
    name text not null,
    company text not null,
    email text not null,
    phone text,
    industry text not null default 'Other',
    company_size text not null default '11-50',
    source text not null default 'Inbound Demo',
    budget numeric not null default 0,
    timeline text not null default '3-6 months',
    decision_maker_seniority text not null default 'Manager / Lead',
    intent_score integer not null default 50,
    tech_stack_match boolean not null default false,
    score integer not null default 50,
    priority text not null check (priority in ('High', 'Medium', 'Low')),
    status text not null check (status in ('New', 'Qualified', 'Needs Review', 'Disqualified', 'Contacted', 'Won')),
    review_decision text not null default 'Pending' check (review_decision in ('Pending', 'Approved', 'Rejected', 'Overridden')),
    review_notes text,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    explanation text,
    feature_importance jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create 'model_audit' table for tracking scoring decisions and drift
create table if not exists public.model_audit (
    id uuid primary key default uuid_generate_v4(),
    lead_id text references public.leads(id) on delete cascade,
    model_version text not null default 'v2.4-ensemble-xgb',
    score integer not null,
    inputs jsonb not null,
    attribution jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.leads enable row level security;
alter table public.model_audit enable row level security;

-- 5. Policies: Allow authenticated and anon read/write with anon key
create policy "Allow all access to leads" on public.leads for all using (true) with check (true);
create policy "Allow all access to model_audit" on public.model_audit for all using (true) with check (true);

-- 6. Indexes for fast queries
create index if not exists idx_leads_score on public.leads(score desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_priority on public.leads(priority);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
