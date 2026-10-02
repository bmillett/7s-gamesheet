# 7s Gamesheet — Feature Plan: Stats Summary, Power Lines, Gender Ratio

## Top-Level Overview

Three new features to be added to the 7s Gamesheet app:

1. **Tournament / Season Stats Page** — A new `/stats` page showing all archived game sheets grouped by tournament, with per-game records and a season-wide player leaderboard.
2. **Power Line Presets** — Named custom lineups (e.g. "Power O", "Power D") saved inside `sheet_data` and selectable from a dropdown in game mode to instantly set a point's lineup.
3. **Gender Ratio Enforcement** — For mixed 7v7, enforce the ABBAABBAA alternating ratio (4 FMP + 3 MMP or 3 FMP + 4 MMP) per point, with a soft warning indicator and a confirmation prompt when an FMP subs into an MMP-matching slot.

All three features are additive — no existing data is broken or migrated. Power line presets and gender ratio settings are stored inside the existing `sheet_data` JSONB blob, requiring no schema migrations.

---

## Decisions & Constraints

- **Power line storage**: Presets are stored in `sheet_data.linePresets` (array of named player-ID groups). They travel with the sheet and copy cleanly via the existing "Use as Template" flow. No new Supabase table needed.
- **Gender ratio setting**: Stored as `sheet_data.genderRatioEnabled` and `sheet_data.startingRatio` (per-sheet, like `startingPossession`). Team-level default is not enforced — each sheet opts in.
- **Gender terminology**: `"FMP"` (Female Matching Player) and `"MMP"` (Male Matching Player) — matching what is already stored in `roster_players.gender`.
- **Stats page**: Read-only server component. Aggregates across all `game_sheets` for the team. Only archived sheets count toward final scores (active/in-progress sheets are excluded from win/loss record but shown with a label).
- **ABBAABBAA pattern**: Starting ratio is set per-sheet (like starting possession). The pattern is derived from point index + starting ratio, so no per-point storage is needed.

---

## Sub-Tasks

---

### Sub-Task 1 — Tournament / Season Stats Page

**Intent**
Create a new `/stats` server-rendered page that reads all sheets for the team and displays:
- Sheets grouped by `tournament_name` (ungrouped sheets listed under "Other Games")
- Per-game row: opponent, score (our–their), W/L, holds, breaks, hold%, break%
- Tournament subtotals (record, aggregate score)
- Season totals row at the bottom
- Player leaderboard: points played, goals, assists, D-blocks, turnovers, drops — sorted by points played descending

**Expected Outcomes**
- `/stats` route loads and displays correctly for a logged-in user with sheets
- Games are grouped by tournament alphabetically; ungrouped games at the bottom
- Only archived sheets count toward W/L record; active sheets show as "In Progress"
- Player leaderboard aggregates stats across all sheets (including non-archived)
- Nav header includes a link to the new `/stats` page

**Todo List**
1. Create `app/(app)/stats/page.tsx` as a server component — fetch `getSheets(team.id)` and `getRosterPlayers(team.id)`, pass to a client component for rendering
2. Create `components/SeasonStatsPanel.tsx` as a client component that accepts `sheets: GameSheetRow[]` and `players: RosterPlayer[]`
3. Implement score/hold/break aggregation logic in `SeasonStatsPanel` — reuse the same derivation pattern from `GameSummaryModal.tsx` (lines 37–100)
4. Build the tournament-grouped table UI with subtotals and season totals row
5. Build the player leaderboard table, sorted by points played descending
6. Add `📈 Stats` link to the nav in `app/(app)/layout.tsx`

**Relevant Context**
- `lib/data/queries.ts` — `getSheets()` and `getRosterPlayers()` already exist; call both in the page component
- `app/(app)/sheet/page.tsx` — follow the same server component pattern (fetch → pass as props)
- `components/GameSummaryModal.tsx` lines 37–100 — score/hold/break derivation logic to reuse
- `types/types.ts` — `GameSheetRow`, `GameSheetData`, `GameSheetPoint`, `RosterPlayer`
- `app/(app)/layout.tsx` line 30 — nav link list to add the Stats link to

**Status** — `[ ] pending`

---

### Sub-Task 2 — Power Line Presets (data model + type changes)

**Intent**
Define the `LinePreset` type and add `linePresets?: LinePreset[]` to `GameSheetData`. This is the only schema change — all else builds on top of it.

**Expected Outcomes**
- `LinePreset` interface exists in `types/types.ts`
- `GameSheetData.linePresets` field is optional (backward compatible)
- TypeScript compiles cleanly with no errors

**Todo List**
1. Add to `types/types.ts`:
   ```
   export interface LinePreset {
     id: string          // uuid or short random key, generated client-side
     name: string        // e.g. "Power O", "Power D"
     playerIds: string[] // ordered list of player IDs (typically 7)
   }
   ```
2. Add `linePresets?: LinePreset[]` to the `GameSheetData` interface
3. Run `tsc --noEmit` to confirm no type errors

**Relevant Context**
- `types/types.ts` lines 62–79 — `GameSheetData` interface
- `lib/offline/db.ts` — IndexedDB schema is schema-less JSONB; no changes needed

**Status** — `[ ] pending`

---

### Sub-Task 3 — Power Line Presets (UI: create, edit, delete)

**Intent**
Add a "Presets" management section in the sheet settings area (alongside the existing line divider controls) where coaches can create a named preset from the currently selected players in a given line, rename it, or delete it.

**Expected Outcomes**
- A "⚡ Presets" toggle button appears next to "✂ Line Splits" and "👥 Bench" in the sheet toolbar
- When expanded, shows a list of existing presets with name, player count, rename and delete actions
- A "Save current lineup as preset…" button opens a small inline form (name input + confirm)
- Creating a preset captures the player IDs currently checked for `selectedLivePoint` (game mode) or all assigned slots if not in game mode
- Saving/renaming/deleting calls `saveData()` with the updated `linePresets` array

**Todo List**
1. Add `showPresetManager` state to `GameSheet`
2. Add the "⚡ Presets" toggle button in the toolbar row (near the Line Splits button)
3. Build the preset list UI: name label, player count badge, rename pencil icon, delete ✕ button
4. Build "Save as preset" inline form with a text input and confirm button
5. Wire create/rename/delete to `saveData({ ...data, linePresets: [...] })`
6. Disable all preset mutations when `isReadOnly`

**Relevant Context**
- `components/GameSheet.tsx` lines 1228–1250 — toolbar button row pattern to follow
- `components/GameSheet.tsx` lines 1888–1930 — line split controls panel pattern (show/hide toggle + panel below)
- `components/GameSheet.tsx` line 379 — `saveData()` function

**Status** — `[ ] pending`

---

### Sub-Task 4 — Power Line Presets (UI: apply to a point)

**Intent**
In live game mode, add a preset selector dropdown (or quick-tap button row) above or alongside the existing "Line 1 / Line 2 / Line 3" quick-select buttons. Tapping a preset sets that point's `playerIds` to the preset's player list (filtered for injured players, same as `setLineOnField`).

**Expected Outcomes**
- In game mode, the preset row appears only when at least one preset exists
- Tapping a preset name applies it to the currently selected live point (replacing the lineup, respecting injured players)
- Applied preset is visually highlighted if the current point's playerIds exactly match the preset
- Works alongside the existing Line 1/2/3 buttons — all are in the same "quick select" area

**Todo List**
1. In the live game mode lineup section (around line 1490–1510 in `GameSheet.tsx`), read `data.linePresets ?? []`
2. If presets exist, render a horizontally scrollable row of preset buttons above the Line 1/2/3 buttons
3. On tap, call `setLineOnField(preset.playerIds, selectedLivePoint)` (existing function handles injured filtering)
4. Highlight the active preset button when `currentLivePointObj.playerIds` matches the preset's player set

**Relevant Context**
- `components/GameSheet.tsx` lines 1490–1510 — "Set Line on Field" button area in game mode
- `components/GameSheet.tsx` lines 592–602 — `setLineOnField()` (reuse as-is, no changes needed)
- `components/GameSheet.tsx` lines 1358–1380 — point selector strip pattern for button row styling

**Status** — `[ ] pending`

---

### Sub-Task 5 — Gender Ratio Enforcement (data model + ratio logic)

**Intent**
Add gender ratio opt-in fields to `GameSheetData` and a pure utility function that computes the expected ratio for any given point index and starting ratio. This utility is used by both the warning indicator and the confirmation prompt.

**Expected Outcomes**
- `GameSheetData` has two new optional fields: `genderRatioEnabled?: boolean` and `startingRatio?: "4fmp-3mmp" | "3fmp-4mmp"`
- A utility function `getExpectedRatio(pointIndex: number, startingRatio: "4fmp-3mmp" | "3fmp-4mmp"): { fmp: number, mmp: number }` exists and is tested mentally against the ABBAABBAA pattern:
  - Pattern index = `pointIndex % 4` with period-4 grouping: AABB repeating → A at positions 0,3,4,7,8… B at positions 1,2,5,6…
  - Verify: starting A="4fmp-3mmp", point 0→4F3M, 1→3F4M, 2→3F4M, 3→4F3M, 4→4F3M, 5→3F4M…
- TypeScript compiles cleanly

**ABBAABBAA pattern derivation**:
The sequence is period-4: `[A, B, B, A, A, B, B, A, ...]`. One gender has 4 players for 1 point, then the other gender has 4 for 2 points, then back, continuing in pairs. For point index `i`, the ratio is A if `i % 4 === 0 or 3`, B if `i % 4 === 1 or 2`. The `startingRatio` records which gender started with 4 (required to derive all subsequent points correctly).

**Todo List**
1. Add `genderRatioEnabled?: boolean` and `startingRatio?: "4fmp-3mmp" | "3fmp-4mmp"` to `GameSheetData` in `types/types.ts`
2. Create `lib/utils/gender-ratio.ts` with:
   - `getExpectedRatio(pointIndex, startingRatio)` — returns `{ fmp: number, mmp: number }`
   - `countGenders(playerIds, allPlayers)` — returns `{ fmp: number, mmp: number, unknown: number }` by looking up each ID in the roster
   - `getRatioStatus(pointIndex, startingRatio, playerIds, allPlayers)` — returns `"ok" | "warning" | "incomplete"` (incomplete = fewer than 7 players)
3. Run `tsc --noEmit`

**Relevant Context**
- `types/types.ts` lines 62–79 — `GameSheetData`
- `types/types.ts` line 27 — `RosterPlayer.gender` stores `"FMP"` | `"MMP"` | `""`
- `lib/utils/haptics.ts` — example of a small utility file in `lib/utils/`

**Status** — `[ ] pending`

---

### Sub-Task 6 — Gender Ratio Enforcement (settings toggle + starting ratio picker)

**Intent**
Add gender ratio opt-in controls to the sheet settings area — a toggle to enable/disable ratio enforcement and a starting ratio picker (mirroring the existing Starting Possession toggle). These controls write to `sheet_data.genderRatioEnabled` and `sheet_data.startingRatio`.

**Expected Outcomes**
- A "⚥ Gender Ratio" toggle button appears in the game mode panel (near Starting Possession toggle)
- When enabled, a two-option picker appears: "Start 4F/3M" or "Start 3F/4M"
- Settings persist via `saveData()` when changed
- Controls are hidden / disabled when `isReadOnly`

**Todo List**
1. Find the Starting Possession toggle in `GameSheet.tsx` (around line 1286–1294) — add the gender ratio toggle and ratio picker directly below it using the same button style
2. Wire toggle to `saveData({ ...data, genderRatioEnabled: !data.genderRatioEnabled })`
3. Wire ratio picker to `saveData({ ...data, startingRatio: selected })`
4. Default `startingRatio` to `"4fmp-3mmp"` when not set and ratio is enabled

**Relevant Context**
- `components/GameSheet.tsx` lines 1286–1294 — Starting Possession toggle (style to match)
- `components/GameSheet.tsx` line 379 — `saveData()`

**Status** — `[ ] pending`

---

### Sub-Task 7 — Gender Ratio Enforcement (warning indicator + FMP-as-MMP confirmation)

**Intent**
Show a live gender ratio badge on each point in game mode (green = correct, amber = wrong ratio, grey = incomplete lineup). When a coach tries to add an FMP player to a point where the expected ratio calls for an MMP slot, show an inline confirmation prompt before proceeding.

**Expected Outcomes**
- In game mode, each point's lineup section shows a ratio badge: e.g. "4F 3M ✓" in green, "5F 2M ⚠" in amber, "—" when ratio is disabled or lineup incomplete
- The existing `/ 7 on field` badge area is updated to also show the ratio status when enabled
- When `togglePlayerPoint` is called and adding the player would result in an FMP filling what should be an MMP slot, an inline confirmation state is shown: "⚠ Adding [Name] as MMP-matching — confirm?" with Yes/Cancel buttons
- "FMP as MMP" confirmation only triggers for FMP players being added when the point already has the correct FMP count (i.e. the remaining open slots should be MMP)
- Cancelling leaves the point unchanged; confirming proceeds with `togglePlayerPoint`

**Todo List**
1. In `GameSheet.tsx`, import `getRatioStatus` and `getExpectedRatio` and `countGenders` from `lib/utils/gender-ratio.ts`
2. Add `pendingFmpAsMmpPlayer` state: `{ playerId: string, pointIndex: number } | null`
3. In the live mode lineup player count badge (line 1387–1395), append the ratio badge when `data.genderRatioEnabled` is true
4. Modify `togglePlayerPoint` to: before adding a player, check if they are FMP and the expected ratio is already met for FMP — if so, set `pendingFmpAsMmpPlayer` state instead of adding
5. Render an inline confirmation card in the live mode panel when `pendingFmpAsMmpPlayer` is not null: show player name, warning text, "Confirm" and "Cancel" buttons
6. "Confirm" calls the original add logic and clears the state; "Cancel" just clears state
7. Add ratio badge to the live mode player-checkbox list rows to show each player's gender at a glance (small FMP/MMP pill)

**Relevant Context**
- `components/GameSheet.tsx` lines 1387–1395 — player count badge (add ratio badge here)
- `components/GameSheet.tsx` lines 1420–1455 — player checkbox list in game mode
- `components/GameSheet.tsx` lines 604–618 — `togglePlayerPoint()` (modify here)
- `lib/utils/gender-ratio.ts` — created in Sub-Task 5

**Status** — `[ ] pending`

---

### Sub-Task 8 — Starting End Indicator

**Intent**
Add a per-sheet "starting end" field (`startingEnd: "left" | "right"`) to `sheet_data` and a visible toggle in the game mode panel so coaches know which end the team started at and can infer the current end after the half-time switch.

**Expected Outcomes**
- A left/right arrow toggle appears in the game mode panel alongside the Starting Possession toggle
- The toggle displays a directional arrow (← or →) and a label ("Started Left" / "Started Right")
- Tapping it flips the value and saves via `saveData()`
- No half-time auto-flip logic — the coach uses it as a reference reminder only
- Disabled when `isReadOnly`

**Todo List**
1. Add `startingEnd?: "left" | "right"` to `GameSheetData` in `types/types.ts`
2. In `GameSheet.tsx`, add a `toggleStartingEnd()` function mirroring `toggleStartingPossession()` that flips between `"left"` and `"right"` and calls `saveData()`
3. Add the toggle button in the game mode panel directly below the Starting Possession toggle (same style — large, high-contrast)
4. Display: `startingEnd === "left" ? "← Started Left" : "→ Started Right"`, defaulting to showing a neutral "Set Starting End" state when unset
5. Run `tsc --noEmit`

**Relevant Context**
- `types/types.ts` lines 62–79 — `GameSheetData` (add `startingEnd` here)
- `components/GameSheet.tsx` — `toggleStartingPossession()` and its button (lines 696–701 and ~1286–1294) — mirror this pattern exactly

**Status** — `[ ] pending`

---

## Execution Order

```
Sub-Task 1 (Stats page) — independent, no dependencies
Sub-Task 8 (Starting End) — independent, no dependencies

Sub-Task 2 (Power Lines: types)
    ↓
Sub-Task 3 (Power Lines: create/edit/delete UI)
    ↓
Sub-Task 4 (Power Lines: apply to point in game mode)

Sub-Task 5 (Gender: data model + utility)
    ↓
Sub-Task 6 (Gender: settings toggle)
    ↓
Sub-Task 7 (Gender: warning + confirmation UI)
```

Sub-Task 1 is fully independent. Sub-Task 8 is also independent (no dependencies). Power Lines (2→3→4) and Gender Ratio (5→6→7) are two separate chains that can be worked in either order, but each chain must be completed in sequence.

---

## Open Questions / Future Considerations

- **Stats page — game_date**: The `game_sheets` table has a `game_date` column but it is not currently exposed in the sheet creation UI. The stats page will fall back to `updated_at` for display ordering. A future sub-task could add a date picker to the sheet header.
- **Power Lines — template copy**: Because presets are stored in `sheet_data`, the existing "Use as Template" flow (which copies `sheet_data`) will automatically carry presets to the new sheet. No extra work needed.
- **Gender ratio — Power Lines interaction**: When a preset is applied in Sub-Task 4 and gender ratio is enabled, the ratio badge will naturally update to reflect the preset's composition. No special integration needed.
- **Gender ratio — unknown gender**: Players with `gender: ""` are counted as `unknown`. The ratio check treats unknown as neither FMP nor MMP and always shows the badge as amber if any unknowns are on the field when ratio is enabled.
