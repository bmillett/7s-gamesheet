export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser, getActiveTeamId } from "@/lib/data/auth"
import { getRosterPlayers, getSheets } from "@/lib/data/queries"
import { SeasonStatsPanel } from "@/components/SeasonStatsPanel"

export default async function StatsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser(await getActiveTeamId())
  if (!team) redirect("/sheet")

  const [rosterPlayers, sheets] = await Promise.all([
    getRosterPlayers(team.id),
    getSheets(team.id),
  ])

  return (
    <SeasonStatsPanel
      teamName={team.name}
      sheets={sheets}
      players={rosterPlayers}
    />
  )
}
