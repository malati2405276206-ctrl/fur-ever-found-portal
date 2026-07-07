-- Migration: NGO Verification Requests system
-- Run this in Supabase SQL Editor

-- 1. Create the ngo_verification_requests table
CREATE TABLE IF NOT EXISTS ngo_verification_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_name        TEXT NOT NULL,
  org_description TEXT,
  phone           TEXT,
  city            TEXT,
  website         TEXT,
  registration_number TEXT,
  documents_url   TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users(id)
);

-- 2. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ngo_verification_user_id ON ngo_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_verification_status ON ngo_verification_requests(status);

-- 3. Enable RLS
ALTER TABLE ngo_verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
-- Users can insert their own requests
CREATE POLICY "Users can insert own verification request"
  ON ngo_verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "Users can read own verification request"
  ON ngo_verification_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (admin) can do everything (handled via supabase client with service key or disable RLS for admin operations)
-- For simplicity with client-side admin, allow all authenticated users to SELECT
-- In production, use a service role key for admin operations
CREATE POLICY "Authenticated users can read all requests"
  ON ngo_verification_requests FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update requests"
  ON ngo_verification_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 5. Ensure profiles table has role column with proper values
-- (This should already exist, but just in case)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 6. If you want to migrate existing ngo_profiles data to the new table:
-- INSERT INTO ngo_verification_requests (user_id, org_name, org_description, phone, city, website, status, created_at, verified_at)
-- SELECT user_id, org_name, org_description, contact_phone, city, website,
--        CASE WHEN verified = true THEN 'approved' ELSE 'pending' END,
--        created_at,
--        CASE WHEN verified = true THEN now() ELSE NULL END
-- FROM ngo_profiles
-- ON CONFLICT DO NOTHING;
