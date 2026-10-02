---
name: add-team
description: Use when the user wants to add a new 7s team or create a team in the 7s-gamesheet app and assign a coach or coach_admin to it.
---

# Add a New 7s Team

Follow these steps to create a new team in Supabase and assign the requesting user as a member (coach_admin).

## Step 1 — Gather Details

Use `ask_followup_question` to collect any missing information:
- **Team name** — what should the team be called?
- **Coach email** — what email address should be added as the coach/admin?
- **Format** — 7v7 (default) or 4v4? (sets `players_per_side` and `roster_size`)

Do not proceed until you have all three.

## Step 2 — Load Supabase Credentials

Read the service-role key and project URL from `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Step 3 — Look Up the User

Use `execute_command` to call the Supabase Auth Admin API and find the user by email:

```powershell
$url  = "<SUPABASE_URL>"
$key  = "<SERVICE_ROLE_KEY>"
$resp = Invoke-RestMethod -Method Get `
  -Uri "$url/auth/v1/admin/users?page=1&per_page=100" `
  -Headers @{ "apikey" = $key; "Authorization" = "Bearer $key" }
$user = $resp.users | Where-Object { $_.email -eq "<EMAIL>" }
if ($user) { Write-Host "Found: $($user.id)" } else { Write-Host "Not found" }
```

If the user is not found, stop and tell the user — they must have an existing account before a team can be assigned. Do not create accounts in this skill.

## Step 4 — Create the Team

POST to `/rest/v1/teams` using the service-role key (bypasses RLS):

```powershell
$headers = @{
  "apikey"        = $key
  "Authorization" = "Bearer $key"
  "Content-Type"  = "application/json"
  "Prefer"        = "return=representation"
}
$rosterSize = if ($playersPerSide -eq 4) { 12 } else { 24 }
$body = @{ name = "<TEAM_NAME>"; players_per_side = $playersPerSide; roster_size = $rosterSize } | ConvertTo-Json
$team = Invoke-RestMethod -Method Post -Uri "$url/rest/v1/teams" -Headers $headers -Body $body
Write-Host "Created team: $($team.id) — $($team.name)"
```

## Step 5 — Add the Coach as a Team Member

POST to `/rest/v1/team_members`:

```powershell
$memberBody = @{ team_id = $team.id; user_id = $userId } | ConvertTo-Json
$member = Invoke-RestMethod -Method Post -Uri "$url/rest/v1/team_members" -Headers $headers -Body $memberBody
Write-Host "Added member: $($member.id)"
```

## Step 6 — Confirm

Report back with a summary table:

| Field | Value |
|---|---|
| Team name | … |
| Format | 7v7 or 4v4 · roster size … |
| Team ID | … |
| Coach email | … |
| Member row ID | … |

Remind the user that the team will appear in their team switcher the next time they log in as that email address, and that additional coaches can be added from the Coaches & Staff page inside the app.
