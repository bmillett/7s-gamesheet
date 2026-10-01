# Tablet UI Optimizations

Changes made to improve usability and readability when running the app on a tablet (iPad, Android tablet) at sideline during a game.

---

## 1. Base Font Size & iOS Input Zoom Prevention

**File:** `app/globals.css`

- Bumped `body` font-size from `15px` → `16px`. This is the browser native default and the threshold below which iOS Safari auto-zooms the viewport when a user taps an input field.
- Added a global rule setting `font-size: max(1rem, 16px)` on all `input`, `select`, and `textarea` elements. Any Tailwind utility class like `text-xs` or `text-sm` on a form element would otherwise drop below 16px and trigger an unwanted viewport zoom on iPad/iPhone.

---

## 2. Navigation Tap Targets

**Files:** `app/(app)/layout.tsx`, `components/LogoutButton.tsx`

All header navigation links (Sheets, Roster, Coaches, Help) and the Sign Out button were `text-xs` with `py-1.5`, giving roughly 28px tap targets — well below the 44px minimum recommended by Apple HIG and Material Design.

Changes:
- `py-1.5` → `py-2.5`
- Added `min-h-[44px] flex items-center` to guarantee 44px height
- `text-xs` → `text-sm` for improved readability at arm's length

---

## 3. Live Game Mode Toggle Button

**File:** `components/GameSheet.tsx`

The "⚡ Live Game Mode (Sideline)" button is the most frequently tapped button during an active game. It was `text-xs py-1.5`.

Changes:
- `py-1.5` → `py-2.5`, added `min-h-[44px]`
- `text-xs` → `text-sm`

---

## 4. Point Selector Strip (Live Game Mode)

**File:** `components/GameSheet.tsx`

The horizontally scrolling strip of 40 point buttons in Live Game Mode was `px-2.5 py-1.5` — tight to scroll through with a moving thumb on the sideline.

Changes:
- `px-2.5 py-1.5` → `px-3 py-2 min-h-[40px]`
- Added extra bottom padding on the scroll container for easier thumb scrolling

---

## 5. Live Mode Player Cards

**File:** `components/GameSheet.tsx`

Player cards in the Live Game Mode line-up grid (tap to toggle on/off field) had several sub-readable text sizes.

Changes:
- Player name: `text-xs` → `text-sm`
- **Jersey number prefix removed** — numbers only shown in the roster grid (see section 9)
- **Position tag removed** — position only shown in the roster grid (see section 10)
- Injury toggle button: `text-[10px] px-1.5 py-0.5` → `text-xs px-2 py-1 min-h-[32px]`
- Points played badge: `text-[10px]` → `text-xs`
- "Line N" set-all badge buttons: `text-[10px] px-2 py-0.5` → `text-xs px-3 py-1.5 min-h-[36px]`
- Line player count label: `text-[11px]` → `text-xs`

---

## 6. Stats Panel — Per-Player Stat Counters

**File:** `components/GameSheet.tsx`

The D-Block / Throwaway / Drop counter buttons were `w-6 h-6` (24px) — too small to tap accurately.

Changes:
- Buttons: `w-6 h-6 text-xs` → `w-8 h-8 text-sm` (32px)
- Count display: `w-5 text-xs` → `w-6 text-sm`
- Column container: widened from `w-16` → `w-20` to accommodate larger buttons
- Column header labels: `text-[10px]` → `text-xs`
- **Jersey number prefix removed** from per-player stat rows (see section 9)

---

## 7. Stats Panel — Opponent Blocks Counter

**File:** `components/GameSheet.tsx`

The ± buttons for "They Got a D" were `w-7 h-7` (28px).

Changes:
- Buttons: `w-7 h-7 text-sm` → `w-9 h-9 text-base` (36px)
- Count display: `w-6 text-sm` → `w-7 text-base`

---

## 8. Timeout Buttons

**File:** `components/GameSheet.tsx`

The four sets of timeout toggle boxes (our/opponent × 1st half/2nd half) were `w-5 h-5 text-[10px]` (20px squares) — essentially untappable on a glass screen under pressure.

Changes:
- All eight buttons: `w-5 h-5 text-[10px]` → `w-8 h-8 text-xs` (32px)

---

## 9. Jersey Numbers Removed from Bench & Live Mode

**File:** `components/GameSheet.tsx`

Jersey numbers were shown in five places outside the roster grid, adding width to every player chip and card for information that is already visible in the grid.

Removed from:
- **Bench pool** player chips
- **Live mode player cards** (tap-to-toggle on/off field)
- **Goal scorer picker** buttons (Stats panel)
- **Assist picker** buttons (Stats panel)
- **Per-player stat rows** (Stats panel)

Jersey numbers are still visible in the roster grid's **No** column.

---

## 10. Position Labels Removed from Bench & Live Mode

**File:** `components/GameSheet.tsx`

Position labels were shown in two places outside the roster grid:
- Bench pool chips showed abbreviated tags (H / C / HY) in a small rounded badge
- Live mode player cards showed the full position string in parentheses, e.g. `(Handler)`

Both were removed. Position is still editable and visible in the roster grid's **Pos** column.

---

## 11. Roster Editor Order Buttons

**File:** `components/RosterEditor.tsx`

The ↑ / ↓ reorder buttons on each roster row were `w-6 h-6` (24px).

Changes:
- `w-6 h-6 text-xs` → `w-9 h-9 text-sm` (36px)

---

## 12. Collapsible Roster Grid

**File:** `components/GameSheet.tsx`

The 24-row roster grid with 40 point columns is the widest element on the page. During an active game in Live Game Mode the grid is mostly read-only and auto-populated, so it takes up significant vertical space without adding value.

A collapse/expand toggle bar was added directly above the grid (screen only, hidden in print):

- Defaults to **expanded** on load
- When collapsed shows a compact summary: `(N players assigned · N points)`
- The grid div uses `hidden print:block` when collapsed — completely removed from screen layout but always rendered during `window.print()` so the paper output is unaffected
