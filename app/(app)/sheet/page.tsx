export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser, getActiveTeamId } from "@/lib/data/auth"
import { getRosterPlayers, getSheets } from "@/lib/data/queries"
import { GameSheet } from "@/components/GameSheet"

export default async function SheetPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser(await getActiveTeamId())
  if (!team) redirect("/sheet") // CreateTeamForm shown in layout

  const [rosterPlayers, sheets] = await Promise.all([
    getRosterPlayers(team.id),
    getSheets(team.id),
  ])

  // Only active players go to the bench pool
  const activePlayers = rosterPlayers.filter((p) => p.is_active)

  return (
    <GameSheet
      teamId={team.id}
      teamName={team.name}
      teamPlayers={activePlayers}
      initialSheets={sheets}
    />
  )
}
