export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser } from "@/lib/data/auth"
import { getTeamMembers } from "@/lib/data/queries"
import { CoachManager } from "@/components/CoachManager"

export default async function CoachesPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser()
  if (!team) redirect("/sheet")

  const members = await getTeamMembers(team.id)

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Coaches & Staff — {team.name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage coaches and scorekeepers who have access to this team&apos;s gamesheets and roster.
        </p>
      </div>
      <CoachManager
        teamId={team.id}
        currentUserId={user.id}
        initialMembers={members}
      />
    </div>
  )
}
