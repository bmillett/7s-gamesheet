# 4s Gamesheet — Setup Plan

## Overview

Two-phase setup: (1) push the repo to GitHub, then (2) create and wire up a real
Supabase project so the app has a live database. No code changes are needed for
either task — both are purely configuration/infrastructure steps.

---

## Sub-Task 1 — Push to GitHub

**Status:** [ ] pending

### Intent
The local repo has no remote. Wire it to `https://github.com/bmillett/4s-gamesheet`
and push the `master` branch.

### Expected Outcomes
- `git remote -v` shows `origin https://github.com/bmillett/4s-gamesheet`
- `master` branch is visible on GitHub with all commits

### Todo List
1. Verify the GitHub repo `bmillett/4s-gamesheet` exists (create it if not — empty, no README)
2. `git remote add origin https://github.com/bmillett/4s-gamesheet.git`
3. `git push -u origin master`

### Relevant Context
- `.git/config` — currently has no `[remote]` section
- GitHub URL: `https://github.com/bmillett/4s-gamesheet`

---

## Sub-Task 2 — Supabase Project Setup

**Status:** [ ] pending

### Intent
Create a real Supabase project, run the migration SQL, create a user, and fill in
`.env.local` with the real keys so the app can connect to the database.

### Expected Outcomes
- Supabase project exists with all 4 tables and RLS policies applied
- `.env.local` contains real `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- App connects successfully and the login page accepts the created user

### RLS Answer
**Yes — RLS is already handled.** The migration (`supabase/migrations/001_initial.sql`) enables
RLS on all 4 tables and creates all necessary policies. You do NOT need to manually enable
or write any policies. Just running the migration SQL is sufficient.

### Todo List

**In the Supabase dashboard (https://supabase.com):**

1. Click **"New project"** — choose an org, set a name (e.g. `4s-gamesheet`), set a DB password (you already have one: `5Eu1!%aaI0!6dWyh` in `.env.local`), pick a region close to you
2. Wait for provisioning (~1–2 min)
3. Go to **SQL Editor** → paste the entire contents of `supabase/migrations/001_initial.sql` → click **Run**
   - This creates all tables, indexes, RLS policies, and triggers in one shot
4. Go to **Authentication → Users → Add user** → enter an email + password (this becomes your login)
5. Go to **Project Settings → API**:
   - Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - Copy **anon / public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
   - Copy **service_role / secret key** → paste as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

**Locally:**
6. Run `npm run dev` and open `http://localhost:3000`
7. Sign in with the email/password created in step 4
8. The app will prompt "Create Team" on first login — enter your team name

### Relevant Context
- Migration file: `supabase/migrations/001_initial.sql`
- RLS is enabled in the migration — no manual toggle needed in the dashboard
- `.env.local` already has the correct variable names; only the values need replacing
- The `SUPABASE_DB_PASSWORD` already in `.env.local` can be used as the DB password in step 1

---

## Sub-Task 3 — Fix .gitignore for PWA build artifacts

**Status:** [ ] pending

### Intent
`public/sw.js` and `public/workbox-*.js` are generated at build time by `@ducanh2912/next-pwa`.
They are currently committed but should be regenerated on each build, not tracked in git.

### Expected Outcomes
- `.gitignore` includes `public/sw.js` and `public/workbox-*.js`
- The files are removed from git tracking

### Todo List
1. Add to `.gitignore`:
   ```
   public/sw.js
   public/workbox-*.js
   ```
2. Run `git rm --cached public/sw.js public/workbox-*.js` to untrack them without deleting
3. Commit the `.gitignore` change

### Relevant Context
- Files currently present: `public/sw.js`, `public/workbox-f1770938.js`
- Noted explicitly in `OUTSTANDING.md` under "Workbox Service Worker Files"
