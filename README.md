# Gamesheet

A progressive web app (PWA) for tracking live game scores, lineups, and player stats for mixed ultimate frisbee. Supports both **4v4** and **7v7** formats from a single codebase — the app adapts automatically based on the team's format.

Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Tailwind CSS](https://tailwindcss.com). Deployed on [Vercel](https://vercel.com).

**Live app:** https://gamesheet.vercel.app

---

## Features

- **Roster management** — Add players with name, jersey number, position (Handler/Cutter/Hybrid), and gender designation (FMP/MMP)
- **Game sheets** — Format-adaptive lineup grid with moveable line dividers (24 slots for 7v7, 12 for 4v4)
- **Live sideline mode** — Large-format tablet/phone UI for scoring points in real time, with one-tap line selection
- **Hold/Break tracking** — Automatically derives holds and breaks from starting possession; manual override supported
- **Player stats** — Per-point goal scorer, assist, D-blocks, throwaways, drops
- **Gender ratio enforcement** — Optional per-sheet toggle; 7v7 uses ABBA alternating 4F/3M pattern, 4v4 enforces 2F/2M fixed ratio
- **Game summary** — Post-game modal with full player stat table
- **Season stats** — Per-tournament records and player leaderboard across all sheets
- **Offline support** — IndexedDB + service worker caches sheets for use without internet; syncs when back online
- **PWA installable** — Add to Home Screen on iOS/Android for a native app feel
- **Print layout** — Landscape print stylesheet for paper game sheets
- **Multi-team** — One login can manage multiple teams; teams can be 4v4 or 7v7

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run `supabase/migrations/001_initial.sql` to create all tables, RLS policies, and triggers
3. Go to **Authentication → Users → Add user** and create a login
4. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optionally, set `NEXT_PUBLIC_FORMAT=4` or `NEXT_PUBLIC_FORMAT=7` to restrict the app to a single format (useful if deploying separate 4s/7s instances). Leave unset to show all teams.

### 3. Run locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add the 3 environment variables in the Vercel project settings
4. Deploy

After deploying, add your Vercel URL to Supabase:
- **Authentication → URL Configuration → Site URL** and **Redirect URLs**

---

## Database migrations

| File | Description |
|------|-------------|
| `supabase/migrations/001_initial.sql` | Full schema — run on a fresh project |
| `supabase/migrations/002_7v7_defaults.sql` | Updates team defaults to 7v7 — run on existing 4s databases |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Offline | IndexedDB + `@ducanh2912/next-pwa` (Workbox) |
| Deployment | Vercel |

---

## Project structure

```
app/
  page.tsx              # Login page
  (app)/
    layout.tsx          # Header + nav (requires auth)
    sheet/page.tsx      # Game sheet page
    roster/page.tsx     # Roster editor page
    help/page.tsx       # Help & usage guide
components/
  GameSheet.tsx         # Main game sheet component (format-adaptive)
  GameSummaryModal.tsx  # Post-game stats modal
  RosterEditor.tsx      # Roster CRUD table
  CreateTeamForm.tsx    # First-login team setup (includes 4v4/7v7 picker)
  SeasonStatsPanel.tsx  # Season & tournament stats
  SyncStatusBadge.tsx   # Online/offline sync indicator
lib/
  data/
    actions.ts          # Server actions (Supabase writes)
    queries.ts          # Server queries (Supabase reads)
    auth.ts             # Auth helpers
  offline/
    sync-engine.ts      # IndexedDB queue + Supabase sync
    db.ts               # IndexedDB schema and helpers
  utils/
    team-config.ts      # Format constants derived from players_per_side
    gender-ratio.ts     # Gender ratio utilities (4v4 and 7v7)
  supabase-browser.ts   # Client-side Supabase instance
  supabase-server.ts    # Server-side Supabase instance
  supabase-admin.ts     # Service-role client (bypasses RLS)
supabase/
  migrations/           # SQL migration files
types/
  types.ts              # Shared TypeScript interfaces
```
