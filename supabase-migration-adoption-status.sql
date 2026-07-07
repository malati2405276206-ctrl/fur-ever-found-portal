-- Migration: Fix adoption_cats status constraint to support all needed values
-- Run this in Supabase SQL Editor

-- Drop existing check constraint if it exists (name may vary)
ALTER TABLE adoption_cats DROP CONSTRAINT IF EXISTS adoption_cats_status_check;

-- Add new constraint allowing all valid statuses
ALTER TABLE adoption_cats ADD CONSTRAINT adoption_cats_status_check 
  CHECK (status IN ('available', 'pending', 'adopted', 'deleted'));

-- Ensure adopted_at column exists
ALTER TABLE adoption_cats ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMPTZ;

-- Ensure adoption_applications table has correct status constraint
ALTER TABLE adoption_applications DROP CONSTRAINT IF EXISTS adoption_applications_status_check;
ALTER TABLE adoption_applications ADD CONSTRAINT adoption_applications_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'));
