import { createClient } from "@/lib/supabase-server"
import type { Team } from "@/types/types"

export async function getTeamForUser(): Promise<Team | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("team_members")
    .select("teams(*)")
    .eq("user_id", user.id)
    .single()

  return (data?.teams as unknown as Team) ?? null
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
