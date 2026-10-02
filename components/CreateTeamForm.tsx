"use client"

import { useState, useTransition } from "react"
import { createTeamAction } from "@/lib/data/actions"
import { useRouter } from "next/navigation"

export function CreateTeamForm({ userId }: { userId: string }) {
  const [teamName, setTeamName] = useState("OJ")
  const [format, setFormat] = useState<4 | 7>(7)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    startTransition(async () => {
      const res = await createTeamAction(userId, teamName.trim(), format)
      if ("error" in res) { setError(res.error); return }
      router.refresh()
    })
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-foreground">Welcome! Set up your team</h2>
        <p className="text-sm text-muted-foreground">This creates your team profile for the gamesheet app.</p>
      </div>
      <form onSubmit={handleCreate} className="space-y-3 bg-card border border-border rounded-xl p-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Name</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            placeholder="OJ"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format</label>
          <div className="flex gap-2">
            {([7, 4] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  format === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:border-primary/50"
                }`}
              >
                {f}v{f}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !teamName.trim()}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  )
}
