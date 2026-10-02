# Plan: Fix Coaches Page Not Showing All Team Members

## Top-Level Overview

The coaches page only shows the currently logged-in coach, not all coaches on the team. The root cause is a restrictive Row Level Security (RLS) policy on the `team_members` table that limits SELECT to a user's **own row only** (`user_id = auth.uid()`). Since `getTeamMembers()` uses the regular Supabase client, RLS silently filters out all other team members before the query result is returned.

The fix has two parts:
1. Fix the RLS policy so all team members can see the full membership list for their team.
2. Add a new migration file that applies the policy change to the live database.

The `getTeamMembers()` query code itself is correct — no changes to application code are needed.

---

## Sub-Tasks

---

### Sub-Task 1: Fix the RLS SELECT policy on `team_members`

**Intent**
Replace the overly restrictive `team_members_select` RLS policy with one that allows any team member to read all rows belonging to their team.

**Current policy (line 76, `001_initial.sql`):**
```sql
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (user_id = auth.uid());
```

This allows a user to see only the row where `user_id = auth.uid()`. When `getTeamMembers(team_id)` queries all rows for a team, every row except the caller's own is filtered out.

**Correct policy:**
```sql
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT USING (is_team_member(team_id));
```

`is_team_member(team_id)` returns `TRUE` if `auth.uid()` has a row in `team_members` for that `team_id`. This allows all coaches on the same team to see each other, while still preventing cross-team access.

**Expected Outcomes**
- The `team_members_select` policy in `001_initial.sql` is updated to use `is_team_member(team_id)`.
- A new migration file is created (e.g. `003_fix_team_members_select_policy.sql`) that drops the old policy and creates the corrected one, so it can be applied to the live/hosted Supabase project.

**Todo List**
1. Update line 76 of `supabase/migrations/001_initial.sql` to use `is_team_member(team_id)` for the `team_members_select` policy.
2. Create a new file `supabase/migrations/003_fix_team_members_select_policy.sql` with the `DROP POLICY` + `CREATE POLICY` statements to apply the fix to a running database.

**Relevant Context**
- `supabase/migrations/001_initial.sql` line 76 — current broken policy
- `supabase/migrations/001_initial.sql` lines 62–68 — `is_team_member()` helper function (already exists, safe to use)
- `lib/data/queries.ts` lines 45–68 — `getTeamMembers()` uses `createClient()` (regular client subject to RLS)
- `app/(app)/coaches/page.tsx` — calls `getTeamMembers(team.id)` and passes results to `CoachManager`

**Status:** [ ] pending

---
