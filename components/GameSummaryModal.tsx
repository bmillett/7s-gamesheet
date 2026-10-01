"use client"

/**
 * components/coaches/GameSummaryModal.tsx
 *
 * Post-game summary modal displaying individual player point totals,
 * offensive vs defensive distribution, hold/break rates,
 * and game statistics.
 */

import React, { useState } from "react"
import type { GameSheetData, GameSheetPlayer, GameSheetPoint } from "@/types/types"

interface GameSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  data: GameSheetData
  opponentName: string
  teamName?: string
  field?: string
  allPlayers: Array<{ id: string; display_name: string | null; jersey_number: number | null; position: string | null }>
}

export function GameSummaryModal({
  isOpen,
  onClose,
  data,
  opponentName,
  teamName = "OJ",
  field,
  allPlayers,
}: GameSummaryModalProps) {
  const [showPlayingTime, setShowPlayingTime] = useState(false)

  if (!isOpen) return null

  // 1. Calculate Score & Possession Breakdown
  let ourScore = 0
  let theirScore = 0
  let ourHolds = 0
  let ourBreaks = 0
  let theirHolds = 0
  let theirBreaks = 0

  const startPoss = data.startingPossession || "offense"

  // Derive point possession & score stats
  data.points.forEach((pt, idx) => {
    if (pt.scorer === "us") ourScore++
    if (pt.scorer === "them") theirScore++

    // Determine possession for point
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
        // They were on offense when we pulled
        theirHolds++
      } else if (expectedPoss === "offense") {
        // They were on defense when they pulled
        theirBreaks++
      }
    }
  })

  // 2. Individual Player Stats
  const playerStatsMap = new Map<
    string,
    {
      player: GameSheetPlayer
      totalPoints: number
      oPoints: number
      dPoints: number
      pointsWon: number
      goals: number
      assists: number
      dBlocks: number
      throwaways: number
      drops: number
    }
  >()

  // Map assigned players
  data.players.forEach((p) => {
    if (p && p.playerId) {
      playerStatsMap.set(p.playerId, {
        player: p,
        totalPoints: 0,
        oPoints: 0,
        dPoints: 0,
        pointsWon: 0,
        goals: 0,
        assists: 0,
        dBlocks: 0,
        throwaways: 0,
        drops: 0,
      })
    }
  })

  // Team-level opponent blocks total
  const totalOpponentBlocks = data.points.reduce((sum, pt) => sum + (pt.opponentBlocks ?? 0), 0)

  // Aggregate points played
  data.points.forEach((pt, idx) => {
    let expectedPoss: "offense" | "defense" = startPoss
    if (idx > 0) {
      const prev = data.points[idx - 1]
      if (prev.scorer === "us") expectedPoss = "defense"
      else if (prev.scorer === "them") expectedPoss = "offense"
    }

    pt.playerIds.forEach((pid) => {
      const entry = playerStatsMap.get(pid)
      if (entry) {
        entry.totalPoints++
        if (expectedPoss === "offense") entry.oPoints++
        else entry.dPoints++
        if (pt.scorer === "us") entry.pointsWon++
      }
    })

    // Goal scorer
    if (pt.scorer === "us" && pt.goalScorerId) {
      const entry = playerStatsMap.get(pt.goalScorerId)
      if (entry) entry.goals++
    }

    // Assist
    if (pt.assistPlayerId) {
      const entry = playerStatsMap.get(pt.assistPlayerId)
      if (entry) entry.assists++
    }

    // Per-player live stats
    if (pt.playerStats) {
      Object.entries(pt.playerStats).forEach(([pid, pStats]) => {
        const entry = playerStatsMap.get(pid)
        if (entry) {
          entry.dBlocks += pStats.dBlocks
          entry.throwaways += pStats.throwaways
          entry.drops += pStats.drops
        }
      })
    }
  })

  const sortedPlayerStats = Array.from(playerStatsMap.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints || a.player.slotOrder - b.player.slotOrder
  )

  const isWin = ourScore > theirScore
  const isComplete = false // timed game — no score-based completion

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl p-6 text-foreground space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                Game Summary & Stats
              </span>
              {data.isArchived && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Finalized
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold mt-1">
              {teamName} vs {opponentName || "Opponent"}
            </h2>
            {field && <p className="text-xs text-muted-foreground">Field: {field}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scoreboard Card */}
        <div className="grid grid-cols-3 items-center justify-center p-4 rounded-xl bg-accent/30 border border-border/80 text-center">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">{teamName}</div>
            <div className={`text-4xl font-extrabold ${isWin ? "text-emerald-600" : "text-foreground"}`}>
              {ourScore}
            </div>
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isComplete ? "Final" : "Current Score"}
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground">{opponentName || "Opponent"}</div>
            <div className="text-4xl font-extrabold text-rose-600">{theirScore}</div>
          </div>
        </div>

        {/* Tactical Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-semibold">{teamName} Conversions</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{ourHolds}H</span>
              <span className="text-xl font-bold text-blue-600">{ourBreaks}B</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Holds: {ourHolds} &nbsp; Breaks: {ourBreaks}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xs font-medium text-rose-700 dark:text-rose-400 font-semibold">{opponentName || "Opponent"} Conversions</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-rose-600">{theirHolds}H</span>
              <span className="text-xl font-bold text-purple-600">{theirBreaks}B</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Holds: {theirHolds} &nbsp; Breaks: {theirBreaks}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xs font-medium text-muted-foreground">Started On</div>
            <div className="text-xl font-bold uppercase text-foreground mt-0.5">
              {startPoss === "offense" ? "Offense (O)" : "Defense (D)"}
            </div>
            <div className="text-[11px] text-muted-foreground">Pt 1 Initial Line</div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xs font-medium text-muted-foreground">Active Roster</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {sortedPlayerStats.length} Players
            </div>
            <div className="text-[11px] text-muted-foreground">
              {data.injuredPlayerIds?.length || 0} marked out/injured
            </div>
          </div>

          <div className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xs font-medium text-rose-700 dark:text-rose-400 font-semibold">Opp. Blocks Against</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">{totalOpponentBlocks}</div>
            <div className="text-[11px] text-muted-foreground">Times they D&apos;d us</div>
          </div>
        </div>

        {/* Player Stats Table */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground flex items-center justify-between gap-2">
            <span>Player Stats</span>
            <button
              type="button"
              onClick={() => setShowPlayingTime((v) => !v)}
              className="text-xs font-normal text-primary hover:underline"
            >
              {showPlayingTime ? "▴ Hide Playing Time" : "▾ Show Playing Time"}
            </button>
          </h3>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/60 text-muted-foreground font-semibold sticky top-0 border-b border-border">
                <tr>
                  <th className="p-2.5">Player</th>
                  <th className="p-2.5 text-center">Pos</th>
                  <th className="p-2.5 text-center">Pts</th>
                  <th className="p-2.5 text-center text-amber-600 dark:text-amber-400">Goal</th>
                  <th className="p-2.5 text-center text-amber-600 dark:text-amber-400">Ast</th>
                  <th className="p-2.5 text-center text-blue-600 dark:text-blue-400">Blk</th>
                  <th className="p-2.5 text-center text-orange-600 dark:text-orange-400">T/A</th>
                  <th className="p-2.5 text-center text-rose-600 dark:text-rose-400">Drop</th>
                  {showPlayingTime && (
                    <>
                      <th className="p-2.5 text-center text-emerald-600 dark:text-emerald-400">O-Line</th>
                      <th className="p-2.5 text-center text-blue-600 dark:text-blue-400">D-Line</th>
                      <th className="p-2.5 text-center">Pt +/-</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedPlayerStats.map((item) => (
                  <tr key={item.player.playerId} className="hover:bg-accent/40 transition-colors">
                    <td className="p-2.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>{item.player.displayName}</span>
                        {data.injuredPlayerIds?.includes(item.player.playerId) && (
                          <span className="text-[10px] px-1.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold">
                            🩹 Out
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center text-muted-foreground font-mono">
                      {item.player.position || "-"}
                    </td>
                    <td className="p-2.5 text-center font-bold text-foreground">
                      {item.totalPoints}
                    </td>
                    <td className="p-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
                      {item.goals || 0}
                    </td>
                    <td className="p-2.5 text-center font-medium text-amber-600 dark:text-amber-400">
                      {item.assists || 0}
                    </td>
                    <td className="p-2.5 text-center font-bold text-blue-600 dark:text-blue-400">
                      {item.dBlocks || 0}
                    </td>
                    <td className="p-2.5 text-center font-medium text-orange-600 dark:text-orange-400">
                      {item.throwaways || 0}
                    </td>
                    <td className="p-2.5 text-center font-medium text-rose-600 dark:text-rose-400">
                      {item.drops || 0}
                    </td>
                    {showPlayingTime && (
                      <>
                        <td className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 font-medium">
                          {item.oPoints}
                        </td>
                        <td className="p-2.5 text-center text-blue-700 dark:text-blue-400 font-medium">
                          {item.dPoints}
                        </td>
                        <td className="p-2.5 text-center font-semibold">
                          <span className={item.pointsWon > item.totalPoints / 2 ? "text-emerald-600" : "text-muted-foreground"}>
                            {item.pointsWon} / {item.totalPoints}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-accent text-foreground transition-colors"
          >
            🖨️ Print Summary
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

