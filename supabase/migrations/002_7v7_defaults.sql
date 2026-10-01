-- ============================================================
-- 7s Gamesheet — Update defaults for 7v7 format
-- Apply this to any existing database previously running the 4s schema.
-- ============================================================

ALTER TABLE public.teams ALTER COLUMN players_per_side SET DEFAULT 7;
ALTER TABLE public.teams ALTER COLUMN roster_size SET DEFAULT 24;
