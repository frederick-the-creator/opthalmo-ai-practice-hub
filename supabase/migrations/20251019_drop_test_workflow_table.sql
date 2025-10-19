-- Migration: Drop the minimal test table after workflow validation
-- Safe to run even if table is already absent

drop table if exists public.test_workflow;
