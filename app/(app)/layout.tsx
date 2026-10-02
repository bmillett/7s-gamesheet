export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getTeamForUser, getTeamsForUser, getActiveTeamId } from "@/lib/data/auth"
import { AppHeader } from "@/components/AppHeader"
import { CreateTeamForm } from "@/components/CreateTeamForm"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const [team, allTeams] = await Promise.all([
    getTeamForUser(await getActiveTeamId()),
    getTeamsForUser(),
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        allTeams={allTeams}
        currentTeamId={team?.id ?? ""}
        teamName={team?.name ?? ""}
      />

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4">
        {!team ? (
          <CreateTeamForm userId={user.id} />
        ) : (
          children
        )}
      </main>
    </div>
  )
}
