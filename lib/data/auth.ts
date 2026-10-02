import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"
import type { Team } from "@/types/types"

export async function getTeamsForUser(): Promise<Team[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("team_members")
    .select("teams(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (!data) return []
  return data.map((row) => row.teams as unknown as Team).filter(Boolean)
}

export async function getTeamForUser(preferredTeamId?: string | null): Promise<Team | null> {
  const teams = await getTeamsForUser()
  if (teams.length === 0) return null
  if (preferredTeamId) {
    const match = teams.find((t) => t.id === preferredTeamId)
    if (match) return match
  }
  return teams[0]
}

export async function getActiveTeamId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get("activeTeamId")?.value ?? null
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
