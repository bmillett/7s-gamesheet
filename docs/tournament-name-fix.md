# Bug Fix: Tournament Name Not Persisting on Refresh

## Symptom

Typing a tournament name into the metadata bar appeared to save (the field showed the value), but after a page refresh the field was blank. Opponent name and field name had the same latent issue.

---

## Root Causes

### 1. `tournament_name` missing from the entire save chain

The field existed in the Supabase schema and in the `GameSheetRow` / `SheetEntry` TypeScript types, but was never forwarded through any of the layers that actually write to the database.

| Layer | What was missing |
|---|---|
| `lib/offline/db.ts` — `LocalGameSheet` interface | `tournament_name: string \| null` field |
| `lib/offline/db.ts` — `PendingSyncAction` payload type | `tournamentName?: string` field |
| `lib/offline/sync-engine.ts` — `queueSheetUpdate` meta param | `tournamentName?: string` option |
| `lib/offline/sync-engine.ts` — `LocalGameSheet` write | `tournament_name` not read from `meta` |
| `lib/offline/sync-engine.ts` — `PendingSyncAction` payload | `tournamentName` not included |
| `lib/offline/sync-engine.ts` — `processQueue` server patch | `tournament_name` not added to Supabase patch |
| `components/GameSheet.tsx` — `save()` local `setSheets` mirror | `tournament_name` not forwarded |
| `components/GameSheet.tsx` — `save()` `syncEngine.queueSheetUpdate` call | `tournamentName` not passed |
| `components/GameSheet.tsx` — `save()` `useCallback` dep array | `tournamentName` missing, stale closure risk |
| `components/GameSheet.tsx` — `handlePrecacheTournament` | `tournament_name` missing from manual `LocalGameSheet` object (build error) |

### 2. `onBlur`-only saves are unreliable on iOS Safari / tablets

The tournament, opponent, and field inputs all saved via `onBlur`. On iOS Safari, tapping away from a text input to another element (a button, a checkbox) does not reliably fire the `blur` event. The value appeared saved locally (React state updated in `onChange`) but the actual `save()` call never ran.

Additionally, the `onBlur` handlers referenced state variables (`tournamentName`, `opponentName`, `fieldName`) via closure. Since `save` is a `useCallback`, there was a window where the closure held a stale value if the component had not yet re-rendered with the updated dep.

---

## Fixes Applied

### `lib/offline/db.ts`
- Added `tournament_name: string | null` to the `LocalGameSheet` interface.
- Added `tournamentName?: string` to the `PendingSyncAction` payload type.

### `lib/offline/sync-engine.ts`
- Added `tournamentName?: string` to the `queueSheetUpdate` `meta` parameter type.
- Included `tournament_name` in the `LocalGameSheet` written to IndexedDB, reading from `meta.tournamentName` with fallback to the existing local record.
- Included `tournamentName` in the queued `PendingSyncAction` payload.
- Added `tournament_name` to the server patch object in `processQueue`, conditionally applied when `action.payload.tournamentName !== undefined`.

### `components/GameSheet.tsx` — `save()` callback
- Added `tournament_name` to the local `setSheets` mirror update.
- Passed `tournamentName` to `syncEngine.queueSheetUpdate`, using `patch.tournament_name` when provided or the current state value as fallback.
- Added `tournamentName` to the `useCallback` dependency array.
- Removed an unused `sheet` variable.

### `components/GameSheet.tsx` — metadata inputs
- Switched tournament, opponent, and field inputs from **`onBlur`-only** saves to **`onChange`** saves, passing the fresh event value directly to `save()`.
- This matches the pattern already used by the Sheet Title input and eliminates the iOS blur reliability issue and the stale closure risk entirely.

### `components/GameSheet.tsx` — `handlePrecacheTournament`
- Added `tournament_name: s.tournament_name` to the manually constructed `LocalGameSheet` object in the precache loop. This field became required after the type change and caused a TypeScript build error without it.
