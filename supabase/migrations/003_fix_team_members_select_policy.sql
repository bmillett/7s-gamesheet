-- Fix: allow team members to see all other members of their team.
-- The previous policy (user_id = auth.uid()) only returned the caller's own row,
-- causing the coaches page to hide all other coaches in the list.
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (is_team_member(team_id));
