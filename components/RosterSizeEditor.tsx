"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateTeamRosterSizeAction } from "@/lib/data/actions"

interface RosterSizeEditorProps {
  teamId: string
  rosterSize: number
}

export function RosterSizeEditor({ teamId, rosterSize }: RosterSizeEditorProps) {
  const router = useRouter()
  const [size, setSize] = useState(rosterSize)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (size === rosterSize) return
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const res = await updateTeamRosterSizeAction(teamId, size)
      if ("error" in res) { setError(res.error); return }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSave} className="flex items-center gap-1.5 mt-0.5">
      <span className="text-xs text-muted-foreground">Roster size:</span>
      <input
        type="number"
        min={1}
        max={40}
        value={size}
        onChange={(e) => { setSize(Number(e.target.value)); setSaved(false) }}
        className="w-14 rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {size !== rosterSize && (
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      )}
      {saved && <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  )
}
