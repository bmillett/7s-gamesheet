export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser, getActiveTeamId } from "@/lib/data/auth"
import { getTeamMembers } from "@/lib/data/queries"
import { CoachManager } from "@/components/CoachManager"
import { TeamSettings } from "@/components/TeamSettings"

export default async function CoachesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser(await getActiveTeamId())
  if (!team) redirect("/sheet")

  const members = await getTeamMembers(team.id)

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Coaches & Staff — {team.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage coaches and scorekeepers who have access to this team&apos;s gamesheets and roster.
        </p>
      </div>
      <TeamSettings
        teamId={team.id}
        teamName={team.name}
        playersPerSide={team.players_per_side}
      />
      <CoachManager
        teamId={team.id}
        currentUserId={user.id}
        initialMembers={members}
      />
    </div>
  )
}
