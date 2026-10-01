export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, getTeamForUser } from "@/lib/data/auth"
import { createClient } from "@/lib/supabase-server"
import { LogoutButton } from "@/components/LogoutButton"
import { ThemeToggle } from "@/components/ThemeToggle"
import { CreateTeamForm } from "@/components/CreateTeamForm"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/")

  const team = await getTeamForUser()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-base text-foreground tracking-tight">7s Gamesheet</span>
            {team && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {team.name}
              </span>
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
