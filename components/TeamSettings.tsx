"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateTeamNameAction, updateTeamFormatAction } from "@/lib/data/actions"

interface TeamSettingsProps {
  teamId: string
  teamName: string
  playersPerSide: number
}

export function TeamSettings({ teamId, teamName, playersPerSide }: TeamSettingsProps) {
  const router = useRouter()
  const [name, setName] = useState(teamName)
  const [format, setFormat] = useState<4 | 7>(playersPerSide === 4 ? 4 : 7)
  const [nameError, setNameError] = useState<string | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [formatSaved, setFormatSaved] = useState(false)
  const [namePending, startNameTransition] = useTransition()
  const [formatPending, startFormatTransition] = useTransition()

  function handleNameSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setNameError(null)
    setNameSaved(false)
    startNameTransition(async () => {
      const res = await updateTeamNameAction(teamId, name.trim())
      if ("error" in res) { setNameError(res.error); return }
      setNameSaved(true)
      router.refresh()
    })
  }

  function handleFormatChange(newFormat: 4 | 7) {
    if (newFormat === format) return
    setFormat(newFormat)
    setFormatError(null)
    setFormatSaved(false)
    startFormatTransition(async () => {
      const res = await updateTeamFormatAction(teamId, newFormat)
      if ("error" in res) { setFormatError(res.error); setFormat(format); return }
      setFormatSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="text-sm font-bold text-foreground">Team Settings</h2>

      {/* Team name */}
      <form onSubmit={handleNameSave} className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Name</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setNameSaved(false) }}
            required
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={namePending || !name.trim() || name.trim() === teamName}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {namePending ? "Saving…" : "Save"}
          </button>
        </div>
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        {nameSaved && <p className="text-xs text-emerald-600 dark:text-emerald-400">Name updated.</p>}
      </form>

      {/* Format */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format</label>
        <div className="flex gap-2">
          {([7, 4] as const).map((f) => (
            <button
              key={f}
              type="button"
              disabled={formatPending}
              onClick={() => handleFormatChange(f)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${
                format === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-input hover:border-primary/50"
              }`}
            >
              {f}v{f}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Changes the sheet grid size and gender ratio rules. Existing game sheets are not affected.
        </p>
        {formatError && <p className="text-xs text-destructive">{formatError}</p>}
        {formatSaved && <p className="text-xs text-emerald-600 dark:text-emerald-400">Format updated.</p>}
      </div>
    </div>
  )
}
