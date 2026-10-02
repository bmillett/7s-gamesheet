"use client"

import React, { useState } from "react"
import type { GameSheetRow, GameSheetData, RosterPlayer } from "@/types/types"

interface SeasonStatsPanelProps {
  teamName: string
  sheets: GameSheetRow[]
  players: RosterPlayer[]
}

// ---------------------------------------------------------------------------
// Per-game derived stats
// ---------------------------------------------------------------------------

interface GameStats {
  id: string
  opponent: string
  tournament: string | null
  ourScore: number
  theirScore: number
  ourHolds: number
  ourBreaks: number
  theirHolds: number
  theirBreaks: number
  isArchived: boolean
}

function deriveGameStats(sheet: GameSheetRow): GameStats {
  const data: GameSheetData = sheet.sheet_data
  const startPoss = data.startingPossession || "offense"

  let ourScore = 0
  let theirScore = 0
  let ourHolds = 0
  let ourBreaks = 0
  let theirHolds = 0
  let theirBreaks = 0

  data.points.forEach((pt, idx) => {
    if (pt.scorer === "us") ourScore++
    if (pt.scorer === "them") theirScore++

    let expectedPoss: "offense" | "defense" = startPoss
    if (idx > 0) {
      const prev = data.points[idx - 1]
      if (prev.scorer === "us") expectedPoss = "defense"
      else if (prev.scorer === "them") expectedPoss = "offense"
    }

    if (pt.scorer === "us") {
      if (pt.isCleanHold || (expectedPoss === "offense" && !pt.isCleanBreak)) {
        ourHolds++
      } else if (pt.isCleanBreak || expectedPoss === "defense") {
        ourBreaks++
      }
    } else if (pt.scorer === "them") {
      if (expectedPoss === "defense") {
        theirHolds++
      } else if (expectedPoss === "offense") {
        theirBreaks++
      }
    }
  })

  return {
    id: sheet.id,
    opponent: sheet.opponent_name || "Unknown",
    tournament: sheet.tournament_name,
    ourScore,
    theirScore,
    ourHolds,
    ourBreaks,
    theirHolds,
    theirBreaks,
    isArchived: Boolean(data.isArchived),
  }
}

// ---------------------------------------------------------------------------
// Per-player season-aggregate stats
// ---------------------------------------------------------------------------

interface PlayerSeasonStats {
  playerId: string
  displayName: string
  jerseyNumber: number | null
  position: string
  totalPoints: number
  goals: number
  assists: number
  dBlocks: number
  throwaways: number
  drops: number
}

function derivePlayerStats(sheets: GameSheetRow[], players: RosterPlayer[]): PlayerSeasonStats[] {
  const map = new Map<string, PlayerSeasonStats>()

  // Seed from roster so everyone appears even with zero stats
  players.forEach((p) => {
    map.set(p.id, {
      playerId: p.id,
      displayName: p.display_name,
      jerseyNumber: p.jersey_number,
      position: p.position,
      totalPoints: 0,
      goals: 0,
      assists: 0,
      dBlocks: 0,
      throwaways: 0,
      drops: 0,
    })
  })

  sheets.forEach((sheet) => {
    const data = sheet.sheet_data

    // Build a map of playerId → displayName/position from this sheet's player list
    const sheetPlayerMap = new Map(data.players.map((p) => [p.playerId, p]))

    // Ensure sheet players exist in the stats map (covers players removed from roster)
    data.players.forEach((p) => {
      if (!map.has(p.playerId)) {
        map.set(p.playerId, {
          playerId: p.playerId,
          displayName: p.displayName,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          totalPoints: 0,
          goals: 0,
          assists: 0,
          dBlocks: 0,
          throwaways: 0,
          drops: 0,
        })
      }
    })

    data.points.forEach((pt) => {
      pt.playerIds.forEach((pid) => {
        const entry = map.get(pid)
        if (entry) entry.totalPoints++
      })

      if (pt.scorer === "us" && pt.goalScorerId) {
        const entry = map.get(pt.goalScorerId)
        if (entry) entry.goals++
      }

      if (pt.assistPlayerId) {
        const entry = map.get(pt.assistPlayerId)
        if (entry) entry.assists++
      }

      if (pt.playerStats) {
        Object.entries(pt.playerStats).forEach(([pid, stats]) => {
          const entry = map.get(pid)
          if (entry) {
            entry.dBlocks += stats.dBlocks
            entry.throwaways += stats.throwaways
            entry.drops += stats.drops
          }
        })
      }
    })
  })

  return Array.from(map.values())
    .filter((p) => p.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints || a.displayName.localeCompare(b.displayName))
}

// ---------------------------------------------------------------------------
// Tournament group helpers
// ---------------------------------------------------------------------------

interface TournamentGroup {
  name: string | null // null = "Other Games"
  games: GameStats[]
}

function groupByTournament(games: GameStats[]): TournamentGroup[] {
  const map = new Map<string, GameStats[]>()
  const nullKey = "__other__"

  games.forEach((g) => {
    const key = g.tournament ?? nullKey
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(g)
  })

  const groups: TournamentGroup[] = []

  // Named tournaments first (sorted)
  Array.from(map.entries())
    .filter(([k]) => k !== nullKey)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, gs]) => groups.push({ name, games: gs }))

  // "Other Games" at bottom
  if (map.has(nullKey)) {
    groups.push({ name: null, games: map.get(nullKey)! })
  }

  return groups
}

function groupTotals(games: GameStats[]) {
  const archived = games.filter((g) => g.isArchived)
  const wins = archived.filter((g) => g.ourScore > g.theirScore).length
  const losses = archived.filter((g) => g.ourScore < g.theirScore).length
  const ourTotal = archived.reduce((s, g) => s + g.ourScore, 0)
  const theirTotal = archived.reduce((s, g) => s + g.theirScore, 0)
  const ourHolds = archived.reduce((s, g) => s + g.ourHolds, 0)
  const ourBreaks = archived.reduce((s, g) => s + g.ourBreaks, 0)
  return { wins, losses, ourTotal, theirTotal, ourHolds, ourBreaks, count: archived.length }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function pct(num: number, den: number) {
  if (den === 0) return "—"
  return `${Math.round((num / den) * 100)}%`
}

function GameRow({ g, teamName }: { g: GameStats; teamName: string }) {
  const isWin = g.ourScore > g.theirScore
  const isLoss = g.ourScore < g.theirScore
  const totalScored = g.ourScore
  const holdPct = pct(g.ourHolds, g.ourHolds + g.ourBreaks)
  const breakPct = pct(g.ourBreaks, g.theirHolds + g.theirBreaks || 1)

  return (
    <tr className="hover:bg-accent/30 transition-colors border-b border-border/60 last:border-0">
      <td className="py-2 px-3 font-medium text-foreground">{g.opponent}</td>
      <td className="py-2 px-3 text-center font-bold tabular-nums">
        <span className={isWin ? "text-emerald-600" : isLoss ? "text-rose-600" : "text-foreground"}>
          {g.ourScore}
        </span>
        <span className="text-muted-foreground mx-1">–</span>
        <span className="text-foreground">{g.theirScore}</span>
      </td>
      <td className="py-2 px-3 text-center">
        {g.isArchived ? (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWin ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : isLoss ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-muted text-muted-foreground"}`}>
            {isWin ? "W" : isLoss ? "L" : "T"}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">In Progress</span>
        )}
      </td>
      <td className="py-2 px-3 text-center text-sm tabular-nums">{g.ourHolds}</td>
      <td className="py-2 px-3 text-center text-sm tabular-nums">{g.ourBreaks}</td>
      <td className="py-2 px-3 text-center text-xs text-muted-foreground tabular-nums">{holdPct}</td>
    </tr>
  )
}

function TotalsRow({ totals, label }: { totals: ReturnType<typeof groupTotals>; label: string }) {
  if (totals.count === 0) return null
  return (
    <tr className="bg-muted/40 font-semibold text-sm border-t-2 border-border">
      <td className="py-2 px-3 text-muted-foreground italic">{label}</td>
      <td className="py-2 px-3 text-center font-bold tabular-nums">
        <span className="text-emerald-600">{totals.ourTotal}</span>
        <span className="text-muted-foreground mx-1">–</span>
        <span>{totals.theirTotal}</span>
      </td>
      <td className="py-2 px-3 text-center">
        <span className="text-xs font-bold">
          {totals.wins}W–{totals.losses}L
        </span>
      </td>
      <td className="py-2 px-3 text-center tabular-nums">{totals.ourHolds}</td>
      <td className="py-2 px-3 text-center tabular-nums">{totals.ourBreaks}</td>
      <td className="py-2 px-3 text-center text-xs text-muted-foreground">
        {pct(totals.ourHolds, totals.ourHolds + totals.ourBreaks)}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SeasonStatsPanel({ teamName, sheets, players }: SeasonStatsPanelProps) {
  const [activeTab, setActiveTab] = useState<"games" | "players">("games")

  const allGameStats = sheets.map(deriveGameStats)
  const tournamentGroups = groupByTournament(allGameStats)
  const seasonTotals = groupTotals(allGameStats)
  const playerStats = derivePlayerStats(sheets, players)

  const tableHeaderCls = "py-2 px-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground bg-muted/60 sticky top-0"
  const tableHeaderCenterCls = tableHeaderCls + " text-center"

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">{teamName} — Season Stats</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {seasonTotals.count} finalized game{seasonTotals.count !== 1 ? "s" : ""} · {seasonTotals.wins}W–{seasonTotals.losses}L
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("games")}
            className={`px-4 py-2 transition-colors ${activeTab === "games" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            📋 Games
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("players")}
            className={`px-4 py-2 border-l border-border transition-colors ${activeTab === "players" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            📊 Players
          </button>
        </div>
      </div>

      {/* ── GAMES TAB ── */}
      {activeTab === "games" && (
        <div className="space-y-6">
          {sheets.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No game sheets yet. Create a sheet on the Sheets page.</p>
          ) : (
            tournamentGroups.map((group) => {
              const totals = groupTotals(group.games)
              return (
                <div key={group.name ?? "__other__"} className="rounded-xl border border-border overflow-hidden">
                  {/* Tournament header */}
                  <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {group.name ?? "Other Games"}
                    </span>
                    {totals.count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {totals.wins}W–{totals.losses}L · {totals.ourTotal}–{totals.theirTotal}
                      </span>
                    )}
                  </div>

                  {/* Game rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className={tableHeaderCls}>Opponent</th>
                          <th className={tableHeaderCenterCls}>Score</th>
                          <th className={tableHeaderCenterCls}>Result</th>
                          <th className={tableHeaderCenterCls}>Holds</th>
                          <th className={tableHeaderCenterCls}>Breaks</th>
                          <th className={tableHeaderCenterCls}>Hold%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.games.map((g) => (
                          <GameRow key={g.id} g={g} teamName={teamName} />
                        ))}
                        {group.games.length > 1 && (
                          <TotalsRow totals={totals} label="Subtotal" />
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}

          {/* Season totals */}
          {tournamentGroups.length > 1 && seasonTotals.count > 0 && (
            <div className="rounded-xl border-2 border-primary/30 overflow-hidden">
              <div className="px-4 py-2.5 bg-primary/10 border-b border-primary/20">
                <span className="font-extrabold text-sm text-foreground">Season Totals</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className={tableHeaderCls}>Summary</th>
                      <th className={tableHeaderCenterCls}>Score</th>
                      <th className={tableHeaderCenterCls}>Record</th>
                      <th className={tableHeaderCenterCls}>Holds</th>
                      <th className={tableHeaderCenterCls}>Breaks</th>
                      <th className={tableHeaderCenterCls}>Hold%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TotalsRow totals={seasonTotals} label="All Games" />
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PLAYERS TAB ── */}
      {activeTab === "players" && (
        <div className="rounded-xl border border-border overflow-hidden">
          {playerStats.length === 0 ? (
            <p className="text-sm text-muted-foreground italic p-4">No player stats recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className={tableHeaderCls}>Player</th>
                    <th className={tableHeaderCenterCls}>Pos</th>
                    <th className={tableHeaderCenterCls + " text-foreground"}>Pts</th>
                    <th className={tableHeaderCenterCls + " text-amber-600 dark:text-amber-400"}>Goals</th>
                    <th className={tableHeaderCenterCls + " text-amber-600 dark:text-amber-400"}>Ast</th>
                    <th className={tableHeaderCenterCls + " text-blue-600 dark:text-blue-400"}>Blk</th>
                    <th className={tableHeaderCenterCls + " text-orange-600 dark:text-orange-400"}>T/A</th>
                    <th className={tableHeaderCenterCls + " text-rose-600 dark:text-rose-400"}>Drop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {playerStats.map((p) => (
                    <tr key={p.playerId} className="hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {p.jerseyNumber != null && (
                            <span className="text-[10px] font-bold text-muted-foreground w-5 text-right tabular-nums">
                              #{p.jerseyNumber}
                            </span>
                          )}
                          {p.displayName}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-muted-foreground font-mono">{p.position || "—"}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums">{p.totalPoints}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums text-amber-600 dark:text-amber-400">{p.goals || "—"}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums text-amber-600 dark:text-amber-400">{p.assists || "—"}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums text-blue-600 dark:text-blue-400">{p.dBlocks || "—"}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums text-orange-600 dark:text-orange-400">{p.throwaways || "—"}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums text-rose-600 dark:text-rose-400">{p.drops || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
