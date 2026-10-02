"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { setActiveTeamAction } from "@/lib/data/actions"
import { LogoutButton } from "@/components/LogoutButton"
import { ThemeToggle } from "@/components/ThemeToggle"
import type { Team } from "@/types/types"

interface AppHeaderProps {
  teamName: string
  currentTeamId: string
  allTeams: Team[]
}

export function AppHeader({ teamName, currentTeamId, allTeams }: AppHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleTeamChange(teamId: string) {
    startTransition(async () => {
      await setActiveTeamAction(teamId)
      router.refresh()
    })
  }

  return (
    <header className="border-b border-border bg-card sticky top-0 z-40 print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-base text-foreground tracking-tight">7s Gamesheet</span>

          {teamName && (
            allTeams.length > 1 ? (
              <select
                value={currentTeamId}
                disabled={isPending}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Switch active team"
              >
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {teamName}
              </span>
            )
          )}
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href="/sheet"
            className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            📋 Sheets
          </Link>
          <Link
            href="/roster"
            className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            👥 Roster
          </Link>
          <Link
            href="/coaches"
            className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            🧢 Coaches
          </Link>
          <Link
            href="/stats"
            className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            📈 Stats
          </Link>
          <Link
            href="/help"
            className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            ❓ Help
          </Link>
          <ThemeToggle />
          <LogoutButton />
        </nav>
      </div>
    </header>
  )
}
