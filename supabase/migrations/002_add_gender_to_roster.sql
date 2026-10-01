-- Add gender designation (FMP / MMP) to roster_players
-- Run this against any existing database created from 001_initial.sql
ALTER TABLE public.roster_players ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT '';
