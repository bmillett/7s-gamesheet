# 7s Gamesheet Migration Plan

## Top-Level Overview

Convert the existing 4v4 digital gamesheet app to support 7v7 ultimate frisbee.
The primary change for this phase is the **line configuration**: replace the hardcoded
4-player-per-line (12 total slots) system with three new presets designed for 7v7 squads:

| Preset | Lines | Slots per line | Total slots | lineDividers |
|--------|-------|----------------|-------------|--------------|
| **3 lines of 8** (default) | 3 | 8 / 8 / 8 | 24 | [8, 16] |
| **3 lines — 10 / 7 / 7** | 3 | 10 / 7 / 7 | 24 | [10, 17] |
| **2 lines of 12** | 2 | 12 / 12 | 24 | [12] |

All three presets share `TOTAL_SLOTS = 24`, so the grid is always 24 rows.

After the game-sheet changes are working, the repo will be pushed to
`https://github.com/bmillett/7s-gamesheet`, a fresh Supabase project will be
provisioned with the updated schema, and the app will be deployed on Vercel.

---

## Sub-Tasks

---

### Sub-Task 1 — Update the database schema defaults

**Intent**
Change the Supabase migration file so that new teams default to 7v7 values
and the `game_sheets.sheet_data` JSONB default reflects the new 3-lines-of-8 preset.
This also adds a new migration file that can be run against an existing database if needed.

**Expected Outcomes**
- `supabase/migrations/001_initial.sql` defaults read `players_per_side = 7`, `roster_size = 24`, and `lineDividers: [8, 16]`.
- A new file `supabase/migrations/002_7v7_defaults.sql` exists with `ALTER TABLE` statements that can be applied to an existing database.

**Todo List**
1. Edit `supabase/migrations/001_initial.sql`:
   - Change `players_per_side DEFAULT 4` → `DEFAULT 7`
   - Change `roster_size DEFAULT 12` → `DEFAULT 24`
   - Change JSONB default `lineDividers:[4,8]` → `lineDividers:[8,16]`
2. Create `supabase/migrations/002_7v7_defaults.sql` with:
   - `ALTER TABLE public.teams ALTER COLUMN players_per_side SET DEFAULT 7;`
   - `ALTER TABLE public.teams ALTER COLUMN roster_size SET DEFAULT 24;`

**Relevant Context**
- `supabase/migrations/001_initial.sql` lines 9–10 (column defaults) and line 45 (JSONB default)

**Status** — `[ ] pending`

---

### Sub-Task 2 — Update frontend constants and line-preset UI in GameSheet

**Intent**
Replace the hardcoded `TOTAL_SLOTS = 12` and `DEFAULT_DIVIDERS = [4, 8]` constants with
the 7v7 equivalents, and replace the existing line-split preset buttons
("2 Lines 6/6", "3 Lines 4/4/4") with the three new 7v7 presets.

**Expected Outcomes**
- `TOTAL_SLOTS = 24` and `DEFAULT_DIVIDERS = [8, 16]` at the top of `GameSheet.tsx`.
- The Line Splits panel shows exactly three buttons:
  - **3 Lines — 8/8/8** (sets dividers to `[8, 16]`)
  - **3 Lines — 10/7/7** (sets dividers to `[10, 17]`)
  - **2 Lines — 12/12** (sets dividers to `[12]`)
- A fourth **No Split** button (clears all dividers, `lineDividers: []`) is retained as an escape hatch.
- The grid renders 24 rows correctly and the `normalizePlayers` function handles up to slot 23.
- The live-mode "Line 1 / Line 2 / Line 3" quick-select buttons derive their ranges from `lineDividers` as they already do, so no changes needed there.

**Todo List**
1. In `components/GameSheet.tsx`:
   - Change `TOTAL_SLOTS` from `12` to `24`.
   - Change `DEFAULT_DIVIDERS` from `[4, 8]` to `[8, 16]`.
2. Locate the line-split preset button block (around line 1884–1926 of `GameSheet.tsx`) and replace the existing preset buttons with three new ones matching the presets above.
3. Verify that `normalizePlayers` (line 76) correctly handles `TOTAL_SLOTS = 24` — it already uses `TOTAL_SLOTS` dynamically, so no logic change should be needed, only confirm.

**Relevant Context**
- `components/GameSheet.tsx` lines 53–54 (constants)
- `components/GameSheet.tsx` lines 1884–1926 (line-split preset UI — read this block before editing)
- `lib/data/actions.ts` line 28 — `DEFAULT_SHEET_DATA.lineDividers` must also be updated to `[8, 16]`

**Status** — `[ ] pending`

---

### Sub-Task 3 — Update DEFAULT_SHEET_DATA in server actions

**Intent**
The server-side `DEFAULT_SHEET_DATA` constant in `lib/data/actions.ts` still uses
`lineDividers: [4, 8]`. This must be updated so new sheets created via the server action
start with the correct 7v7 default. The fallback in `duplicateSheetAction` must also be updated.

**Expected Outcomes**
- `DEFAULT_SHEET_DATA.lineDividers` in `lib/data/actions.ts` is `[8, 16]`.
- The fallback in `duplicateSheetAction` (line 106) uses `[8, 16]` not `[4, 8]`.

**Todo List**
1. In `lib/data/actions.ts` line 28, change `lineDividers: [4, 8]` → `[8, 16]`.
2. In `lib/data/actions.ts` line 106 (duplicate fallback), change `[4, 8]` → `[8, 16]`.

**Relevant Context**
- `lib/data/actions.ts` lines 19–31 (`DEFAULT_SHEET_DATA`)
- `lib/data/actions.ts` line 106 (`duplicateSheetAction` fallback)

**Status** — `[ ] pending`

---

### Sub-Task 4 — Update UI copy and branding from "4s" to "7s"

**Intent**
All user-visible text and metadata that references "4v4", "4s", "12-slot", "12-player",
or "4/4/4" must be updated to reflect the 7v7 format.

**Expected Outcomes**
- `app/layout.tsx` metadata title/description references "7s" not "4v4".
- `app/page.tsx` login screen references "7s Mixed".
- `app/(app)/help/page.tsx` updated: "12-player roster" → "24-player roster", "4/4/4" → "8/8/8", and the sub-heading references the new presets.
- `app/(app)/roster/page.tsx` any hardcoded "12-player" copy updated.
- Comment block at top of `components/GameSheet.tsx` (lines 1–27) updated to reflect 7v7 slot count and new line presets.

**Todo List**
1. `app/layout.tsx` — update metadata strings referencing "4v4" or "4s".
2. `app/page.tsx` — update the "4v4 Mixed Indoor" display string.
3. `app/(app)/help/page.tsx`:
   - Line 8: "4s Gamesheet" → "7s Gamesheet"
   - Line 17: "12-player roster" → "24-player roster"
   - Line 57: "12-slot lineup" → "24-slot lineup"
   - Line 88: "4/4/4 (rows 1–4, 5–8, 9–12)" → "8/8/8 (rows 1–8, 9–16, 17–24)"
4. `app/(app)/roster/page.tsx` — check for and update any hardcoded "12-player" strings.
5. `components/GameSheet.tsx` comment block (lines 1–27) — update "24 guaranteed rows", preset descriptions.

**Relevant Context**
- `app/(app)/help/page.tsx` (full file already read)
- `app/layout.tsx` line 6
- `app/page.tsx` line 36

**Status** — `[ ] pending`

---

### Sub-Task 5 — Push to GitHub

**Intent**
Commit all changes and push to the existing remote at
`https://github.com/bmillett/7s-gamesheet`.

**Expected Outcomes**
- All changes are committed with a descriptive message.
- The `main` branch on `https://github.com/bmillett/7s-gamesheet` reflects the updated code.

**Todo List**
1. Run `git status` to confirm working tree state.
2. Run `git add -A`.
3. Run `git commit -m "feat: migrate from 4v4 to 7v7 — 24-slot grid, new line presets, updated schema defaults"`.
4. Run `git push origin main` (or the default branch name if different).

**Relevant Context**
- Verify remote is already set: `git remote -v`

**Status** — `[ ] pending`

---

### Sub-Task 6 — Wire up shared Supabase project

**Intent**
The 7s app will reuse the existing Supabase project already serving the 4s app
(`dluaugsjryxmnogudnhs.supabase.co`). No new project or schema migration is needed —
the schema already supports any `players_per_side` value via the `teams` table.
This sub-task is just wiring the credentials into the 7s app and Vercel.

**Expected Outcomes**
- `.env.local` in `D:\7s-gamesheet` contains the same Supabase credentials as `D:\4s-gamesheet`.
- Vercel environment variables for the 7s deployment are set to the same Supabase project.
- The Vercel deployment URL for the 7s app is added to Supabase Auth → Redirect URLs (alongside the existing 4s URL — do not replace it).

**Todo List**
1. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from `D:\4s-gamesheet\.env.local` into `D:\7s-gamesheet\.env.local`.
2. In Supabase dashboard → Project Settings → API, confirm the keys match.
3. No migration SQL needs to be run — the existing schema is already compatible.
4. After the Vercel deployment in Sub-Task 7, add the new 7s Vercel URL to Supabase Auth → URL Configuration → Redirect URLs (do not change or remove the existing 4s redirect URL).

**Relevant Context**
- Existing Supabase project: `https://dluaugsjryxmnogudnhs.supabase.co`
- `D:\4s-gamesheet\.env.local` — source of truth for credentials
- The `teams.players_per_side` column already distinguishes 4s teams (value=4) from 7s teams (value=7); RLS isolates all data by `team_id`

**Status** — `[ ] pending`

---

### Sub-Task 7 — Deploy on Vercel

**Intent**
Create a new Vercel project for the 7s app, separate from any existing 4s deployment,
pointed at the same Supabase project.

**Expected Outcomes**
- A new Vercel project is linked to `https://github.com/bmillett/7s-gamesheet`.
- All required environment variables are set (same Supabase credentials as the 4s app).
- A production deployment succeeds with no build errors.
- The deployed URL is added to Supabase Auth → Redirect URLs.

**Todo List**
1. Go to https://vercel.com/new and import the GitHub repo `bmillett/7s-gamesheet`.
2. Set the framework preset to **Next.js** (should auto-detect).
3. Add the following environment variables (same values as the 4s Vercel project):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy** and wait for the build to complete.
5. Copy the production URL (`https://<project>.vercel.app`) and add it to Supabase Auth → URL Configuration → Redirect URLs. **Do not change the existing Site URL** — adding to Redirect URLs is sufficient.
6. Test login and sheet creation end-to-end on the live URL: create a team, verify it gets `players_per_side = 7`, create a sheet and confirm the 24-slot grid with 8/8/8 default.

**Relevant Context**
- `app/layout.tsx` — no hardcoded `NEXT_PUBLIC_SITE_URL` needed; Vercel injects the deployment URL automatically.
- The 4s and 7s apps share auth — a user who signs up on the 7s app could theoretically also log into the 4s app; teams remain isolated by `team_id` and RLS.

**Status** — `[ ] pending`

---

> **Note on shared auth:** Because both apps share one Supabase project, a user account is global. A coach could log into both apps with the same email. Their 4s team and 7s team are completely separate (different `team_id` rows), and RLS ensures neither app can read the other's data. This is intentional and requires no extra work.

---

## Execution Order

```
Sub-Task 1 (schema)
    ↓
Sub-Task 2 (GameSheet constants + preset UI)
    ↓
Sub-Task 3 (server action defaults)
    ↓
Sub-Task 4 (UI copy)
    ↓
Sub-Task 5 (GitHub push)
    ↓
Sub-Task 6 (Supabase provisioning)
    ↓
Sub-Task 7 (Vercel deployment)
```

Sub-Tasks 1–4 are pure code changes and can be reviewed together before the push.
Sub-Tasks 6 and 7 require manual steps in browser dashboards.
