-- ============================================================
-- 7s Gamesheet App — Initial Schema
-- ============================================================

-- Teams
CREATE TABLE public.teams (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL DEFAULT 'OJ',
  players_per_side INT         NOT NULL DEFAULT 7,
  roster_size      INT         NOT NULL DEFAULT 24,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link users to teams
CREATE TABLE public.team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Roster players (managed manually)
CREATE TABLE public.roster_players (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  display_name  TEXT        NOT NULL DEFAULT '',
  jersey_number INT,
  position      TEXT        NOT NULL DEFAULT '',
  gender        TEXT        NOT NULL DEFAULT '',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game sheets
CREATE TABLE public.game_sheets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  opponent_name   TEXT,
  tournament_name TEXT,
  field           TEXT,
  game_date       DATE,
  sheet_data      JSONB       NOT NULL DEFAULT '{"players":[],"points":[],"ourTimeouts":0,"theirTimeouts":0,"lineDividers":[8,16]}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -- Indexes -------------------------------------------------
CREATE INDEX ON public.roster_players (team_id, sort_order);
CREATE INDEX ON public.game_sheets (team_id, updated_at DESC);
CREATE INDEX ON public.team_members (user_id);

-- -- Row Level Security ---------------------------------------
ALTER TABLE public.teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sheets    ENABLE ROW LEVEL SECURITY;

-- Helper: check current user is member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  );
$$;

-- teams: members can read/update their own team
CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (is_team_member(id));
CREATE POLICY "teams_update" ON public.teams FOR UPDATE USING (is_team_member(id));
CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (true); -- first-login create

-- team_members: users can read own membership, insert own row
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- roster_players: team members can do all CRUD
CREATE POLICY "roster_select"  ON public.roster_players FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "roster_insert"  ON public.roster_players FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY "roster_update"  ON public.roster_players FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY "roster_delete"  ON public.roster_players FOR DELETE USING (is_team_member(team_id));

-- game_sheets: team members can do all CRUD
CREATE POLICY "sheets_select"  ON public.game_sheets FOR SELECT USING (is_team_member(team_id));
CREATE POLICY "sheets_insert"  ON public.game_sheets FOR INSERT WITH CHECK (is_team_member(team_id));
CREATE POLICY "sheets_update"  ON public.game_sheets FOR UPDATE USING (is_team_member(team_id));
CREATE POLICY "sheets_delete"  ON public.game_sheets FOR DELETE USING (is_team_member(team_id));

-- -- updated_at trigger ---------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_roster_updated_at  BEFORE UPDATE ON public.roster_players  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sheets_updated_at  BEFORE UPDATE ON public.game_sheets      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
