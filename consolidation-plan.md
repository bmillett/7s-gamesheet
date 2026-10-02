# Consolidation Plan: Merge 4s and 7s Gamesheet Apps into "Gamesheet"

## Overview

The 7s and 4s gamesheet apps are nearly identical Next.js apps sharing the same Supabase database. The `teams` table already has `players_per_side` and `roster_size` columns that fully describe the format. The goal is to make the **7s workspace** the single canonical app — renamed to **"Gamesheet"** — driven entirely by `team.players_per_side`, so that a user who coaches both a 4v4 and a 7v7 team uses one app and the UI adapts automatically when they switch teams.

The 4s workspace (`D:\4s-gamesheet`) is retired after the work is complete.

### Guiding Constraints

- No schema changes — the DB already supports both formats.
- Minimal code change — thread `playersPerSide` through the existing prop chain rather than introducing a heavy context/provider.
- Gender ratio for 4v4 is **disabled by default**, always 2 FMP / 2 MMP when enabled, no alternating pattern.
- Existing 4s teams in the DB already have `players_per_side = 4` — no data migration needed.

---

## Sub-Task 1 — Extend `gender-ratio.ts` to support 4v4

**Status:** `[ ] pending`

### Intent
The existing gender-ratio utility is 7v7-only (ABBA alternating pattern, 4/3 or 3/4 splits). For 4v4 the ratio is constant every point: always 2 FMP / 2 MMP. Rather than duplicating the utility, add a format-aware path inside the same file so all callers use one API.

### Expected Outcomes
- `getExpectedRatio` accepts an optional `playersPerSide` argument and returns `{ fmp: 2, mmp: 2 }` when `playersPerSide === 4`, ignoring the `startingRatio` and `pointIndex` parameters in that case.
- `getRatioStatus` uses `playersPerSide` to determine the expected count and the "full" threshold (4 for 4v4 vs 7 for 7v7).
- `isFmpAsMmp` uses `playersPerSide` to know when the FMP quota (2) is already full in a 4v4 point.
- The `StartingRatio` type and all 7v7 logic remain unchanged.
- All existing 7v7 call sites continue to work without modification (new parameter is optional, defaults to `7`).

### Todo List
1. Add an optional `playersPerSide?: number` parameter (default `7`) to `getExpectedRatio`, `getRatioStatus`, and `isFmpAsMmp`.
2. In `getExpectedRatio`: if `playersPerSide === 4`, return `{ fmp: 2, mmp: 2 }` immediately, ignoring `pointIndex` and `startingRatio`.
3. In `getRatioStatus`: replace the hardcoded `< 7` incomplete threshold with `< playersPerSide`.
4. In `isFmpAsMmp`: use `getExpectedRatio(pointIndex, startingRatio, playersPerSide)` so the FMP quota is correct for the format.

### Relevant Context
- `lib/utils/gender-ratio.ts` — the entire file is in scope.
- The 4v4 model: every point is always 2 FMP / 2 MMP; `startingRatio` is irrelevant.

---

## Sub-Task 2 — Add `lib/utils/team-config.ts`

**Status:** `[ ] pending`

### Intent
Centralise all format-specific constants (slot count, default dividers, divider presets, min/default/max points, roster size description text) in one place so `GameSheet`, `CreateTeamForm`, and any future components derive them from a single source of truth rather than hardcoded literals.

### Expected Outcomes
- A new file `lib/utils/team-config.ts` exports a `getTeamConfig(playersPerSide: number)` function.
- The returned config object includes:
  - `totalSlots` — 24 for 7v7, 12 for 4v4
  - `defaultDividers` — `[8, 16]` for 7v7, `[4, 8]` for 4v4
  - `dividerPresets` — the labeled preset list for each format (7v7: 4 options; 4v4: 3 options)
  - `minPoints`, `defaultPoints`, `maxPoints` — per-format defaults
  - `rosterSizeLabel` — e.g. `"24-player"` or `"12-player"`
  - `formatLabel` — e.g. `"7v7"` or `"4v4"`

### Todo List
1. Create `lib/utils/team-config.ts`.
2. Define the `TeamConfig` interface with the fields above.
3. Implement `getTeamConfig(playersPerSide: number): TeamConfig` with a `switch` or `if/else` for 4 vs 7 (fallback to 7v7 defaults for unknown values).
4. Export the function and the interface.

### Relevant Context
- 7v7 constants currently live at the top of `components/GameSheet.tsx` lines 55–59.
- 4v4 constants are at `D:\4s-gamesheet\components\GameSheet.tsx` lines 53–57.
- 7v7 divider presets: `[8,16]`, `[10,17]`, `[12]`, `[]` (lines 2273–2306 of 7s GameSheet.tsx).
- 4v4 divider presets: `[6]`, `[4,8]`, `[]` (lines 1966–1988 of 4s GameSheet.tsx).

---

## Sub-Task 3 — Update `createTeamAction` and `CreateTeamForm` to accept format

**Status:** `[ ] pending`

### Intent
When a new team is created, the user should choose whether it is 4v4 or 7v7. That choice sets `players_per_side` and `roster_size` on the new team row. The `createTeamAction` server action must pass these through to the insert.

### Expected Outcomes
- `CreateTeamForm` renders a format selector (4v4 / 7v7) in addition to the team name field.
- The selected format is passed to `createTeamAction`.
- `createTeamAction` inserts the team with the correct `players_per_side` and `roster_size` (24 for 7v7, 12 for 4v4).
- The offline IndexedDB name in `lib/offline/db.ts` is updated from the hard-coded `"4s_gamesheet_offline_db"` to `"gamesheet_offline_db"`.

### Todo List
1. Update `createTeamAction(userId, teamName, playersPerSide)` in `lib/data/actions.ts` to accept `playersPerSide: 4 | 7` and pass `players_per_side` and `roster_size` to the insert.
2. Update `CreateTeamForm` to add a format picker (two buttons or a select: "4v4" / "7v7", defaulting to 7v7).
3. Update the `createTeamAction` call in `CreateTeamForm` to pass `playersPerSide`.
4. Rename `DB_NAME` in `lib/offline/db.ts` from `"4s_gamesheet_offline_db"` to `"gamesheet_offline_db"` and bump `DB_VERSION` to `2` with a migration that preserves existing object stores (no structural change needed, just the rename forces a new open).

### Relevant Context
- `lib/data/actions.ts` — `createTeamAction` at line 162.
- `components/CreateTeamForm.tsx` — the full component (53 lines).
- `lib/offline/db.ts` — `DB_NAME` at line 10, `DB_VERSION` at line 11.
- `types/types.ts` — `Team` interface already has `players_per_side: number`.

---

## Sub-Task 4 — Thread `playersPerSide` into `GameSheet`

**Status:** `[ ] pending`

### Intent
Replace the hardcoded top-of-file constants in `GameSheet.tsx` with values derived from `getTeamConfig(playersPerSide)`. The component already receives `teamId` and `teamName` — add `playersPerSide` to its props and update all constant references accordingly.

### Expected Outcomes
- `GameSheet` accepts a new `playersPerSide: number` prop.
- `TOTAL_SLOTS`, `DEFAULT_DIVIDERS`, point min/max/default, and divider presets are all derived from `getTeamConfig(playersPerSide)` at the top of the component instead of being literal constants.
- The "N / 7 on field" live-mode player count badge uses `playersPerSide` instead of the hardcoded `7`.
- The divider preset buttons render the correct options for the active format.
- `sheet/page.tsx` passes `team.players_per_side` as the new prop.

### Todo List
1. Add `playersPerSide: number` to `GameSheetProps` interface.
2. Replace the five top-of-file `const` declarations with `const config = getTeamConfig(playersPerSide)` and destructure needed values.
3. Replace all `TOTAL_SLOTS` and `DEFAULT_DIVIDERS` references with `config.totalSlots` and `config.defaultDividers`.
4. Replace the hardcoded point range values with `config.minPoints`, `config.defaultPoints`, `config.maxPoints`.
5. Replace the hardcoded divider preset buttons with a loop over `config.dividerPresets`.
6. Replace the hardcoded `7` in the live-mode "N / 7 on field" badge and the `=== 7` / `> 7` conditional classes with `playersPerSide`.
7. Update `app/(app)/sheet/page.tsx` to pass `team.players_per_side` to `<GameSheet>`.

### Relevant Context
- `components/GameSheet.tsx` lines 55–59 (constants), lines 1505–1512 (live badge), lines 2273–2306 (preset buttons).
- `app/(app)/sheet/page.tsx` — `team` is already fetched; just add the prop.
- `lib/utils/team-config.ts` — created in Sub-Task 2.

---

## Sub-Task 5 — Add 4v4 gender ratio to `GameSheet`

**Status:** `[ ] pending`

### Intent
For 4v4 teams, gender ratio tracking is **off by default** and enforces a constant 2 FMP / 2 MMP (no alternating, no `startingRatio` selector). The UI should hide the "Start 4F/3M / Start 3F/4M" toggle that only makes sense for 7v7.

### Expected Outcomes
- When `playersPerSide === 4` and `genderRatioEnabled` is true:
  - The ratio badge shows "2F 2M" targets.
  - Adding a 3rd FMP to a point triggers the existing FMP-as-MMP warning flow.
  - The "Start 4F/3M" / "Start 3F/4M" toggle button is **not rendered**.
- When `playersPerSide === 7`, all existing 7v7 behaviour is completely unchanged.
- `genderRatioEnabled` defaults to `false` for both formats (already the case; no change needed at the sheet level).
- The calls to `getRatioStatus`, `getExpectedRatio`, and `isFmpAsMmp` inside `GameSheet` pass `playersPerSide` as the new argument added in Sub-Task 1.

### Todo List
1. Pass `playersPerSide` to all three gender-ratio utility call sites in `GameSheet.tsx` (`isFmpAsMmp` at line 623, `getRatioStatus` at line 1514, `getExpectedRatio` at lines 1515 and 1583).
2. Conditionally render the "Start 4F/3M" toggle button only when `playersPerSide === 7` (wrap the existing block at lines 1396–1412 in `{playersPerSide === 7 && (...) }`).
3. Update the "⚥ Ratio On/Off" button tooltip to say `"Toggle gender ratio enforcement (2F/2M)"` when `playersPerSide === 4`.
4. No changes needed to the FMP-as-MMP confirmation dialog — its text is already data-driven from the `expected` value.

### Relevant Context
- `components/GameSheet.tsx` — gender ratio UI at lines 1383–1412, live status badge at lines 1513–1524, FMP-as-MMP dialog at lines 1580–1605.
- `lib/utils/gender-ratio.ts` — updated in Sub-Task 1.

---

## Sub-Task 6 — Update `AppHeader`, roster page, and `app title`

**Status:** `[ ] pending`

### Intent
Surface-level copy and branding that references a fixed format ("7s Gamesheet", "24-player roster") needs to reflect the active team's format. The `AppHeader` already receives `allTeams: Team[]` and `currentTeamId` — the active team's `players_per_side` is available.

### Expected Outcomes
- The header title reads **"Gamesheet"** (format-neutral), with the team badge showing the team name and format label (e.g. "OJ · 7v7").
  - Alternatively: title stays "7s Gamesheet" / "4s Gamesheet" and dynamically updates — either approach is fine; keep it simple.
- The roster page description says "Manage your **12-player** roster" or "**24-player** roster" based on `team.roster_size`.
- The `app/layout.tsx` root title tag / metadata is updated to "Gamesheet" (format-neutral).

### Todo List
1. In `AppHeader`, look up the active team from `allTeams` using `currentTeamId` and derive `formatLabel` from `players_per_side` via `getTeamConfig`. Update the header brand text to include the format (e.g. `"Gamesheet"` with the team badge showing `"OJ · 7v7"`), or simply show `"${formatLabel} Gamesheet"`.
2. In `app/(app)/roster/page.tsx`, replace the hardcoded `"24-player"` with `team.roster_size` (already on the team object fetched at line 12).
3. Update `app/layout.tsx` metadata title from any hardcoded "7s" reference to "Gamesheet".

### Relevant Context
- `components/AppHeader.tsx` lines 33 and 43–48 — brand text and team badge.
- `app/(app)/roster/page.tsx` line 22 — hardcoded "24-player".
- `app/layout.tsx` — check for metadata title.
- `lib/utils/team-config.ts` — `formatLabel` field added in Sub-Task 2.

---

## Sub-Task 7 — Filter team list by `players_per_side` per app (optional hardening)

**Status:** `[ ] pending`

### Intent
Once the apps are combined, a single login will show all teams regardless of format, which is correct and desirable. However, if the two apps are ever deployed separately (e.g. two different Vercel URLs for 4s and 7s leagues), it would be useful to filter teams by format using an env var. This sub-task is **optional** but documents how to do it cleanly if needed.

### Expected Outcomes
- An optional `NEXT_PUBLIC_FORMAT` env var (`"4"` or `"7"`) can be set to restrict which teams are visible.
- When unset, all teams are shown (default combined-app behaviour).
- `getTeamsForUser` in `lib/data/auth.ts` applies the filter when the env var is present.

### Todo List
1. In `lib/data/auth.ts`, after fetching teams, optionally filter by `players_per_side` if `process.env.NEXT_PUBLIC_FORMAT` is set.
2. Document the env var in `.env.local.example`.
3. Verify the 4s app's `.env.local` points to the same Supabase project as the 7s app (they already share one DB).

### Relevant Context
- `lib/data/auth.ts` — `getTeamsForUser` at line 5.
- `.env.local.example` in the 7s workspace root.

---

## Sub-Task 8 — Rename app to "Gamesheet" across all surfaces

**Status:** `[ ] pending`

### Intent
The workspace currently has conflicting names across files (the `package.json` says `"4s-gamesheet"`, `manifest.json` says `"4s Gamesheet"`, `app/layout.tsx` says `"7s Gamesheet"`). The combined app should carry a single neutral name — **"Gamesheet"** — everywhere: the browser tab, the PWA home screen icon, the `package.json` `name` field, the GitHub repo, and the Vercel project.

### Expected Outcomes
- `package.json` `name` field is `"gamesheet"`.
- `app/layout.tsx` metadata `title` is `"Gamesheet"`, `description` is `"Live game sheet for mixed ultimate frisbee"`, and `appleWebApp.title` is `"Gamesheet"`.
- `public/manifest.json` `name` is `"Gamesheet"`, `short_name` is `"Gamesheet"`, `description` is `"Live game sheet for mixed ultimate frisbee"`.
- `README.md` heading and live-app URL are updated to reflect the new name and final Vercel URL.
- The Vercel project is renamed to `gamesheet` (or a more specific slug like `oj-gamesheet` if the generic name is taken) in the Vercel dashboard (manual step — documented as a post-deploy instruction, not a code change).
- The GitHub repo is renamed to `gamesheet` (or `oj-gamesheet`) (manual step — documented similarly).

### Todo List
1. Update `package.json`: set `"name": "gamesheet"`.
2. Update `app/layout.tsx`: set `title: "Gamesheet"`, `description: "Live game sheet for mixed ultimate frisbee"`, `appleWebApp.title: "Gamesheet"`.
3. Update `public/manifest.json`: set `name: "Gamesheet"`, `short_name: "Gamesheet"`, and `description` to match.
4. Update `README.md`: replace all format-specific name references ("7s Gamesheet", "4s Gamesheet") with "Gamesheet", and update the live-app URL to match the final Vercel URL once renamed.
5. **Manual — Vercel:** In the Vercel dashboard → project Settings → General → Project Name → rename to `gamesheet` (or `oj-gamesheet`). The deployment URL updates automatically.
6. **Manual — GitHub:** In the repo settings → rename the repository to `gamesheet` (or `oj-gamesheet`). Update the local remote: `git remote set-url origin https://github.com/<org>/gamesheet.git`.
7. **Manual — Supabase:** After the Vercel rename, update **Authentication → URL Configuration → Site URL** and **Redirect URLs** to include the new Vercel URL.

### Relevant Context
- `package.json` line 2 — currently `"4s-gamesheet"` (mislabelled from initial 4s scaffold).
- `app/layout.tsx` lines 5, 12 — currently `"7s Gamesheet"` / `"7s Sheet"`.
- `public/manifest.json` lines 2–4 — currently `"4s Gamesheet"` / `"4s Sheet"` (mislabelled).
- `README.md` line 1, 7 — currently `"7s Gamesheet"` and `https://7s-gamesheet.vercel.app`.

---

## Sub-Task 9 — Sync 4s-only improvements back to the combined app

**Status:** `[ ] pending`

### Intent
The 4s app has a more detailed `SeasonStatsPanel` (per-tournament grouping, player leaderboard with D-blocks/throwaways/drops, gender display) that the 7s app's version lacks. Before retiring the 4s workspace, pull the better implementation in.

### Expected Outcomes
- `components/SeasonStatsPanel.tsx` in the 7s workspace is replaced with the 4s version (which is the more complete one).
- The 7s stats page continues to work identically from a user perspective.
- `app/(app)/stats/page.tsx` passes the same props it already does — no page change needed.

### Todo List
1. Read `D:\4s-gamesheet\components\SeasonStatsPanel.tsx` fully to confirm it is a strict superset and contains no hardcoded 4v4 slot counts or format assumptions.
2. Copy it into `d:\7s-gamesheet\components\SeasonStatsPanel.tsx`.
3. Verify the props interface matches what `app/(app)/stats/page.tsx` passes.

### Relevant Context
- `components/SeasonStatsPanel.tsx` — 7s version is simpler.
- `D:\4s-gamesheet\components\SeasonStatsPanel.tsx` — the richer version.
- `app/(app)/stats/page.tsx` — the page that renders it.

---

## Sub-Task 10 — Retire the 4s workspace

**Status:** `[ ] pending`

### Intent
Once the combined app is confirmed working, formally document the retirement of the 4s workspace so nothing is accidentally continued there.

### Expected Outcomes
- A `RETIRED.md` file is added to `D:\4s-gamesheet` explaining it has been superseded.
- The 4s Vercel project is deleted or pointed at a redirect to the new Gamesheet URL.
- The 4s GitHub repo is archived (read-only).

### Todo List
1. Add `D:\4s-gamesheet\RETIRED.md` with a note: "This project has been superseded by [Gamesheet](https://github.com/<org>/gamesheet). The combined app supports both 4v4 and 7v7 teams from a single codebase."
2. **Manual — Vercel:** Delete or disable the 4s Vercel project, or set up a redirect to the new Gamesheet Vercel URL.
3. **Manual — GitHub:** Archive the `4s-gamesheet` repository so it is read-only.

### Relevant Context
- No code changes in the 7s/Gamesheet workspace are required for this sub-task.

---

## Notes for Implementation

- Sub-Tasks 1 and 2 have no dependencies and can be done in either order first.
- Sub-Tasks 3, 4, and 5 depend on Sub-Tasks 1 and 2 being complete.
- Sub-Task 6 depends on Sub-Task 2 (for `formatLabel`).
- Sub-Tasks 7, 8, 9, and 10 are independent and can be done last in any order.
- Sub-Task 8 (renaming) can technically be done at any point but is clearest as a near-final step once the app is working.
- Sub-Task 10 (retirement) is purely manual and should be done after the live Gamesheet app is confirmed healthy.
