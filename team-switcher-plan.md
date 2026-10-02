# 7s Gamesheet — Feature Plan: Multi-Team Switcher

## Top-Level Overview

Allow a coach who is a member of more than one team to switch the active team from the app header. All pages (Sheets, Roster, Coaches, Stats) must reload with data scoped to the newly selected team.

### Approach — Cookie-based active team selection

The selected team ID is stored in a short-lived HTTP cookie (`activeTeamId`). Every server component reads this cookie to decide which team to load. The cookie is set via a small Server Action called from a client-side header dropdown.

**Why cookie over URL segment:**
- Avoids restructuring all routes under `app/(app)/[teamId]/...` (significant refactor)
- Persists across page navigations and browser restarts
- Works with the existing `force-dynamic` rendering on all pages
- Users who only have one team see no change in behaviour

### Key constraints
- A user may only switch to a team they are a member of — the server always validates membership before trusting the cookie
- If the cookie holds a stale/invalid teamId (team deleted, removed from team), fall back to the first team in the user's membership list
- No breaking changes to single-team users

---

## Sub-Tasks

---

### Sub-Task 1 — Add `getTeamsForUser()` query and fix `getTeamForUser()`

**Intent**
The current `getTeamForUser()` uses `.single()` which crashes when a user is in multiple teams. Replace it with a robust version that accepts an optional preferred `teamId`, validates it, and falls back to the first team. Add a new `getTeamsForUser()` that returns all teams the user belongs to.

**Expected Outcomes**
- `getTeamsForUser(): Promise<Team[]>` exists in `lib/data/auth.ts` — returns all teams for the authenticated user, ordered by `created_at`
- `getTeamForUser(preferredTeamId?: string): Promise<Team | null>` accepts an optional team ID, validates the user is a member, and falls back to first team if invalid/missing
- Single-team users see no behaviour change
- TypeScript compiles cleanly

**Todo List**
1. In `lib/data/auth.ts`, replace the `.single()` query in `getTeamForUser()` with a `.select("teams(*)")` that returns all rows, then picks the one matching `preferredTeamId` if provided and valid, else the first
2. Add `getTeamsForUser(): Promise<Team[]>` that returns all teams for the user (same query, returns full array)
3. Remove the duplicate `getTeamForUser()` in `lib/data/queries.ts` (lines 5–13) and update its import references across pages to use the one from `lib/data/auth.ts`
4. Run `tsc --noEmit`

**Relevant Context**
- `lib/data/auth.ts` lines 4–16 — current `getTeamForUser()` using `.single()`
- `lib/data/queries.ts` lines 5–13 — duplicate to remove
- All pages import `getTeamForUser` from `@/lib/data/auth` — confirm no imports from queries.ts

**Status** — `[ ] pending`

---

### Sub-Task 2 — Cookie helpers and `setActiveTeamAction` server action

**Intent**
Add a utility to read the `activeTeamId` cookie server-side, and a Server Action to set it. The action validates the user is actually a member of the requested team before writing the cookie.

**Expected Outcomes**
- `getActiveTeamId(): Promise<string | null>` helper reads the `activeTeamId` cookie (available in server components)
- `setActiveTeamAction(teamId: string): Promise<{ error?: string }>` server action validates membership then sets the cookie and calls `revalidatePath("/")`
- Cookie has appropriate settings: `httpOnly: false` (must be readable client-side for optimistic UI), `sameSite: "lax"`, `path: "/"`, `maxAge: 60 * 60 * 24 * 365` (1 year)

**Todo List**
1. Add `getActiveTeamId()` to `lib/data/auth.ts` — reads `cookies()` from `next/headers` and returns the `activeTeamId` value or null
2. Add `setActiveTeamAction(teamId: string)` to `lib/data/actions.ts`:
   - Call `getCurrentUser()` — return error if not authenticated
   - Fetch all team memberships for the user
   - Validate that `teamId` is in the user's teams — return error if not
   - Set cookie via `cookies().set("activeTeamId", teamId, { ... })`
   - Call `revalidatePath("/", "layout")`
   - Return `{}`
3. Run `tsc --noEmit`

**Relevant Context**
- `lib/data/auth.ts` — add `getActiveTeamId()` here alongside `getCurrentUser()`
- `lib/data/actions.ts` — add `setActiveTeamAction()` at the bottom
- `lib/supabase-server.ts` — shows how `cookies()` from `next/headers` is used

**Status** — `[ ] pending`

---

### Sub-Task 3 — Wire `getTeamForUser()` to the active team cookie in all pages

**Intent**
Update the app layout and every team-scoped page to pass the active team cookie value into `getTeamForUser()`. This is the single change that makes all pages switch context when the cookie changes.

**Expected Outcomes**
- `app/(app)/layout.tsx` calls `getTeamForUser(await getActiveTeamId())` and passes all teams to the header for the switcher UI
- All four team-scoped pages (`/sheet`, `/roster`, `/coaches`, `/stats`) call `getTeamForUser(await getActiveTeamId())`
- Single-team users see no behaviour change (cookie is null, falls back to first team)
- If the active team is not found, pages redirect to `/sheet` as they do today

**Todo List**
1. In `app/(app)/layout.tsx`:
   - Import `getActiveTeamId` and `getTeamsForUser` from `@/lib/data/auth`
   - Call both concurrently: `const [team, allTeams] = await Promise.all([getTeamForUser(await getActiveTeamId()), getTeamsForUser()])`
   - Pass `allTeams` and `currentTeamId` as props to a new `AppHeader` client component (see Sub-Task 4)
2. In `app/(app)/sheet/page.tsx` — add `await getActiveTeamId()` call, pass to `getTeamForUser()`
3. In `app/(app)/roster/page.tsx` — same
4. In `app/(app)/coaches/page.tsx` — same
5. In `app/(app)/stats/page.tsx` — same
6. Run `tsc --noEmit`

**Relevant Context**
- `app/(app)/layout.tsx` lines 11–15 — current team fetch
- `app/(app)/sheet/page.tsx` lines 12–13 — pattern to replicate in all pages

**Status** — `[ ] pending`

---

### Sub-Task 4 — Team switcher UI in the header

**Intent**
Extract the header into a dedicated `AppHeader` client component that receives `allTeams`, `currentTeamId`, and the team name. When a user has more than one team, a dropdown appears in the header showing all teams. Selecting one calls `setActiveTeamAction` and triggers a full page reload to reflect the new team context.

**Expected Outcomes**
- New `components/AppHeader.tsx` client component renders the existing header markup
- When `allTeams.length <= 1`, the header shows the team name as a static badge (identical to current behaviour)
- When `allTeams.length > 1`, the team badge becomes a `<select>` dropdown (or a popover menu) listing all teams, with the current team pre-selected
- Selecting a different team calls `setActiveTeamAction(teamId)` then `router.refresh()` to reload with new context
- The dropdown is styled to match the existing team badge (small, rounded-full, primary colour)

**Todo List**
1. Create `components/AppHeader.tsx` as `"use client"` component:
   - Props: `teamName: string`, `allTeams: Team[]`, `currentTeamId: string`
   - Renders the full header nav (move markup from `app/(app)/layout.tsx`)
   - When `allTeams.length > 1`, render a `<select>` in place of the static team badge
   - `onChange` calls `setActiveTeamAction(value)` then `router.refresh()`
2. Update `app/(app)/layout.tsx` to import and render `<AppHeader>` with the required props, removing the inlined header markup
3. On team change, stay on the current page — call `setActiveTeamAction(value)` then `router.refresh()` (no `router.push`)

**Relevant Context**
- `app/(app)/layout.tsx` lines 20–59 — current header markup to move into `AppHeader.tsx`
- `components/LogoutButton.tsx` and `components/ThemeToggle.tsx` — already client components used in the header
- `lib/data/actions.ts` — `setActiveTeamAction` added in Sub-Task 2
- Use a native `<select>` element for the team switcher — renders as a native picker on mobile/tablet (finger-friendly, no overlay issues) and is compact on desktop. Style it to match the existing team badge (small, rounded-full, primary colour scheme).

**Status** — `[ ] pending`

---

## Execution Order

```
Sub-Task 1 (query layer — getTeamsForUser, fix getTeamForUser)
    ↓
Sub-Task 2 (cookie helpers + setActiveTeamAction)
    ↓
Sub-Task 3 (wire cookie into all pages)
    ↓
Sub-Task 4 (header switcher UI)
```

Each sub-task builds on the previous. Sub-Tasks 1 and 2 are pure logic with no UI changes and can be validated with `tsc --noEmit` alone.

---

## Open Questions / Notes

- **CreateTeamForm**: Currently only shown when the user has zero teams. After this feature, a user with multiple teams will never see it. If a coach needs to create a second team, a "New Team" option could be added to the switcher dropdown in future.
- **Team name in offline/IndexedDB**: The offline sync engine stores sheets by `teamId` — no changes needed there since the `teamId` on each sheet is already correct regardless of which team is "active".
- **4s app**: The same feature should be implemented in `D:\4s-gamesheet` separately. The plan is identical since both codebases are mirrors.
