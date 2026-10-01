# 4s Gamesheet — Outstanding Setup & To-Do Items

## Before First Run

### 1. Supabase Project Setup
- Create a new project at https://supabase.com
- Run the migration: copy contents of `supabase/migrations/001_initial.sql` into the Supabase SQL editor and execute
- Create at least one user via Supabase Auth → Authentication → Users → "Add user"

### 2. Environment Variables
- Copy `.env.local.example` to `.env.local`
- Fill in your real values:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```
- The `.env.local` file already has placeholder values that allow the build to pass — replace them before running the dev server

### 3. Git Remote ✅
- ~~Create a GitHub (or other) repo for this project~~
- ~~Add the remote: `git remote add origin https://github.com/your-org/4s-gamesheet.git`~~
- ~~Push: `git push -u origin master`~~
- **Done:** pushed to https://github.com/bmillett/4s-gamesheet

---

## Known Gaps / Follow-Up Work

### App Icons
- `public/icons/` is empty — add real 192×192 and 512×512 PNG icons for PWA installability
- Without icons, "Add to Home Screen" will use a generic browser icon
- Recommended: create a simple violet (#7c3aed) square with "4s" text

### Workbox Service Worker Files ✅
- ~~`public/sw.js` and `public/workbox-*.js` are generated at build time by `@ducanh2912/next-pwa`~~
- ~~These are committed but should be added to `.gitignore` and regenerated on each build~~
- **Done:** added to `.gitignore` and untracked from git

### Print Layout
- The print stylesheet in GameSheet.tsx was designed for 24-slot / landscape layout
- With 12 slots it will still work but may have extra whitespace — review and tighten the print CSS if needed

### Timeout Tracking (Optional)
- 4s indoor ultimate may have different timeout rules than outdoor 7s
- Currently uses the same 2-per-half timeout tracking as TeamHub — adjust or remove as needed

### Score Display Labels
- The summary modal still shows "Hold" and "Break" logic derived from starting possession
- Indoor 4s may not use hold/break terminology — consider replacing with simpler win/loss per point display

### Team Name Edit
- The team name ("OJ") can only be changed at the initial "Create Team" step
- There is no settings page to rename the team after creation — add a simple settings route if needed

### Multi-User / Shared Access
- Completed: Coaches management page at `/coaches` allows adding coach accounts by email & password and removing existing coaches.

### Offline Roster Cache
- The sync engine caches game sheets offline via IndexedDB
- The roster is cached via `saveCachedRoster` in GameSheet on load
- If the roster is updated on the /roster page while offline, those changes won't appear in the gamesheet until the next online sync — acceptable for now

### No Password Reset Flow
- The login page only supports sign-in with existing credentials
- Add a "Forgot password?" link that calls `supabase.auth.resetPasswordForEmail()` if needed

---

## Running Locally

```bash
cd D:\4s-gamesheet
# (fill in .env.local first)
npm run dev
# Open http://localhost:3000
```

## Production Build

```bash
npm run build
npm run start
```