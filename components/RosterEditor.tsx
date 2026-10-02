"use client"

import React, { useState, useTransition } from "react"
import {
  upsertRosterPlayerAction,
  deleteRosterPlayerAction,
} from "@/lib/data/actions"
import type { RosterPlayer } from "@/types/types"

interface RosterEditorProps {
  teamId: string
  initialPlayers: RosterPlayer[]
}

const POSITIONS = ["Handler", "Cutter", "Hybrid", ""]
const GENDERS = ["FMP", "MMP", ""]

export function RosterEditor({ teamId, initialPlayers }: RosterEditorProps) {
  const [players, setPlayers] = useState<RosterPlayer[]>(initialPlayers)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<RosterPlayer>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [csvText, setCsvText] = useState("")
  const [showCsv, setShowCsv] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function startEdit(player: RosterPlayer) {
    setEditingId(player.id)
    setEditValues({
      display_name: player.display_name,
      jersey_number: player.jersey_number,
      position: player.position,
      gender: player.gender ?? "",
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  function saveEdit(player: RosterPlayer) {
    const updated: RosterPlayer = {
      ...player,
      display_name: (editValues.display_name ?? player.display_name).trim(),
      jersey_number: editValues.jersey_number ?? player.jersey_number,
      position: editValues.position ?? player.position,
      gender: editValues.gender ?? player.gender ?? "",
    }
    startTransition(async () => {
      const res = await upsertRosterPlayerAction({ ...updated, team_id: teamId })
      if ("error" in res) { setSaveError(res.error); return }
      setPlayers((prev) => prev.map((p) => (p.id === player.id ? res.player : p)))
      setEditingId(null)
    })
  }

  function addNewPlayer() {
    const newPlayer: RosterPlayer = {
      id: crypto.randomUUID(),
      team_id: teamId,
      display_name: "",
      jersey_number: null,
      position: "",
      gender: "",
      is_active: true,
      sort_order: players.length,
    }
    setPlayers((prev) => [...prev, newPlayer])
    startEdit(newPlayer)
  }

  function deletePlayer(playerId: string) {
    startTransition(async () => {
      const res = await deleteRosterPlayerAction(playerId)
      if ("error" in res) { setSaveError(res.error); return }
      setPlayers((prev) => prev.filter((p) => p.id !== playerId))
      setDeleteConfirmId(null)
    })
  }

  function toggleActive(player: RosterPlayer) {
    const updated = { ...player, is_active: !player.is_active }
    startTransition(async () => {
      const res = await upsertRosterPlayerAction({ ...updated, team_id: teamId })
      if ("error" in res) { setSaveError(res.error); return }
      setPlayers((prev) => prev.map((p) => (p.id === player.id ? res.player : p)))
    })
  }

  function move(playerId: string, dir: "up" | "down") {
    const idx = players.findIndex((p) => p.id === playerId)
    if (dir === "up" && idx === 0) return
    if (dir === "down" && idx === players.length - 1) return
    const next = [...players]
    const swapIdx = dir === "up" ? idx - 1 : idx + 1
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    const reordered = next.map((p, i) => ({ ...p, sort_order: i }))
    setPlayers(reordered)
    startTransition(async () => {
      for (const p of [reordered[idx], reordered[swapIdx]]) {
        await upsertRosterPlayerAction({ ...p, team_id: teamId })
      }
    })
  }

  function importCsv() {
    setCsvError(null)
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean)
    const parsed: Omit<RosterPlayer, "id" | "team_id" | "created_at" | "updated_at">[] = []
    for (const line of lines) {
      const parts = line.split(",").map((s) => s.trim())
      if (parts.length < 2) { setCsvError(`Could not parse: "${line}"`); return }
      const jersey = parseInt(parts[0])
      const name = parts[1]
      const pos = parts[2] ?? ""
      const rawGender = (parts[3] ?? "").toUpperCase()
      const gender = rawGender === "FMP" || rawGender === "MMP" ? rawGender : ""
      if (!name) { setCsvError(`Missing name in: "${line}"`); return }
      parsed.push({ display_name: name, jersey_number: isNaN(jersey) ? null : jersey, position: pos, gender, is_active: true, sort_order: players.length + parsed.length })
    }
    startTransition(async () => {
      const added: RosterPlayer[] = []
      for (const p of parsed) {
        const res = await upsertRosterPlayerAction({ ...p, id: crypto.randomUUID(), team_id: teamId })
        if ("error" in res) { setSaveError(res.error); return }
        added.push(res.player)
      }
      setPlayers((prev) => [...prev, ...added])
      setCsvText("")
      setShowCsv(false)
    })
  }

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/50 text-sm text-red-700 dark:text-red-300">
          {saveError}
          <button onClick={() => setSaveError(null)} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Player table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="p-2.5 w-8">#</th>
              <th className="p-2.5">Name</th>
              <th className="p-2.5 w-16 text-center">Jersey</th>
              <th className="p-2.5 w-20 text-center">Gender</th>
              <th className="p-2.5 w-24">Position</th>
              <th className="p-2.5 w-16 text-center">Active</th>
              <th className="p-2.5 w-20 text-center">Order</th>
              <th className="p-2.5 w-16 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {players.map((player, idx) => {
              const isEditing = editingId === player.id
              return (
                <tr key={player.id} className={`transition-colors ${!player.is_active ? "opacity-50" : "hover:bg-accent"}`}>
                  <td className="p-2 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="p-2">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValues.display_name ?? ""}
                        onChange={(e) => setEditValues((v) => ({ ...v, display_name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(player); if (e.key === "Escape") cancelEdit() }}
                        className="w-full rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    ) : (
                      <button onClick={() => startEdit(player)} className="text-left w-full font-medium text-foreground hover:text-primary truncate">
                        {player.display_name || <span className="italic text-muted-foreground">Click to edit</span>}
                      </button>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        maxLength={2}
                        value={editValues.jersey_number != null ? String(editValues.jersey_number) : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 2)
                          setEditValues((v) => ({ ...v, jersey_number: val === "" ? null : parseInt(val) }))
                        }}
                        className="w-10 rounded border border-input bg-background px-1 py-1 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="##"
                      />
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">{player.jersey_number != null ? `#${player.jersey_number}` : "—"}</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <select
                        value={editValues.gender ?? ""}
                        onChange={(e) => setEditValues((v) => ({ ...v, gender: e.target.value }))}
                        className="w-full rounded border border-input bg-background px-1 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">—</option>
                        {GENDERS.filter(Boolean).map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : (
                      <span className={`text-xs font-semibold ${player.gender === "FMP" ? "text-pink-600" : player.gender === "MMP" ? "text-blue-600" : "text-muted-foreground"}`}>
                        {player.gender || "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <select
                        value={editValues.position ?? ""}
                        onChange={(e) => setEditValues((v) => ({ ...v, position: e.target.value }))}
                        className="w-full rounded border border-input bg-background px-1 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">—</option>
                        {POSITIONS.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{player.position || "—"}</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => toggleActive(player)} className={`text-xs px-2 py-0.5 rounded font-semibold border ${player.is_active ? "bg-green-500/10 border-green-400 text-green-700" : "bg-muted border-border text-muted-foreground"}`}>
                      {player.is_active ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-1">
                     <button onClick={() => move(player.id, "up")} disabled={idx === 0 || isPending} className="w-9 h-9 rounded text-sm border border-border hover:bg-accent disabled:opacity-30">&#8593;</button>
                     <button onClick={() => move(player.id, "down")} disabled={idx === players.length - 1 || isPending} className="w-9 h-9 rounded text-sm border border-border hover:bg-accent disabled:opacity-30">&#8595;</button>
                   </div>
                  </td>
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => saveEdit(player)} disabled={isPending} className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-semibold">Save</button>
                        <button onClick={cancelEdit} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-accent">Cancel</button>
                      </div>
                    ) : deleteConfirmId === player.id ? (
                      <div className="flex items-center gap-1 justify-center">
                        <button onClick={() => deletePlayer(player.id)} disabled={isPending} className="text-xs px-2 py-0.5 rounded bg-destructive text-destructive-foreground font-semibold hover:opacity-90 disabled:opacity-50">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(player.id)} className="text-muted-foreground hover:text-destructive text-sm">&times;</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add player */}
      <button
        type="button"
        onClick={addNewPlayer}
        disabled={isPending}
        className="px-4 py-2 rounded-lg text-sm font-semibold border border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        + Add Player
      </button>

      {/* CSV import */}
      <div className="pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => setShowCsv((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          {showCsv ? "Hide CSV import" : "Bulk import via CSV paste"}
        </button>

        {showCsv && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">One player per line: <code className="bg-muted px-1 rounded">7, Jane Doe, Handler, FMP</code></p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              placeholder={"7, Jane Doe, Handler, FMP\n11, John Smith, Cutter, MMP\n3, Alex Lee, Hybrid"}
              className="w-full rounded-lg border border-input bg-background p-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            {csvError && <p className="text-xs text-destructive">{csvError}</p>}
            <button
              type="button"
              onClick={importCsv}
              disabled={!csvText.trim() || isPending}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Importing..." : "Import Players"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
