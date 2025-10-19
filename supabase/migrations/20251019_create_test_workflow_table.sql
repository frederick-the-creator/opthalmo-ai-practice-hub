-- Migration: Create a minimal test table for workflow validation
-- Safe to run multiple times due to IF NOT EXISTS

create table if not exists public.test_workflow (
  id bigserial primary key,
  created_at timestamptz not null default now()
);

-- To remove after testing:
-- drop table if exists public.test_workflow;
