export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser, getActiveTeamId } from "@/lib/data/auth"
import { getRosterPlayers } from "@/lib/data/queries"
import { RosterEditor } from "@/components/RosterEditor"

export default async function RosterPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser(await getActiveTeamId())
  if (!team) redirect("/sheet")

  const players = await getRosterPlayers(team.id)

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Roster — {team.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your 24-player roster. Active players appear in the gamesheet bench.
        </p>
      </div>
      <RosterEditor teamId={team.id} initialPlayers={players} />
    </div>
  )
}
