import { createClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase-admin"
import type { GameSheetRow, RosterPlayer, Team, TeamMember } from "@/types/types"

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single()
  return data ?? null
}

export async function getRosterPlayers(teamId: string): Promise<RosterPlayer[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("roster_players")
    .select("*")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true })
  return data ?? []
}

export async function getSheets(teamId: string): Promise<GameSheetRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("game_sheets")
    .select("*")
    .eq("team_id", teamId)
    .order("updated_at", { ascending: false })
  return data ?? []
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const supabase = await createClient()
  const { data: members, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })

  if (error || !members) return []

  // Fetch emails using admin client for display
  try {
    const admin = createAdminClient()
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 100 })
    const userMap = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? ""]))

    return members.map((m) => ({
      ...m,
      email: userMap.get(m.user_id) || "Unknown email",
    }))
  } catch {
    return members
  }
}

