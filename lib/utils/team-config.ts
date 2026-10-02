/**
 * lib/utils/team-config.ts
 *
 * Derives all format-specific UI constants from a team's players_per_side value.
 * Use this as the single source of truth instead of hardcoding format constants
 * in individual components.
 */

export interface DividerPreset {
  label: string
  dividers: number[]
}

export interface TeamConfig {
  /** Number of player slots in the sheet grid (12 for 4v4, 24 for 7v7) */
  totalSlots: number
  /** Default line divider positions for a new sheet */
  defaultDividers: number[]
  /** Named divider layout presets shown in the sheet settings */
  dividerPresets: DividerPreset[]
  /** Minimum selectable points for a game */
  minPoints: number
  /** Default number of points for a new sheet */
  defaultPoints: number
  /** Maximum selectable points for a game */
  maxPoints: number
  /** Human-readable roster size label, e.g. "12-player" */
  rosterSizeLabel: string
  /** Short format label, e.g. "4v4" or "7v7" */
  formatLabel: string
}

export function getTeamConfig(playersPerSide: number): TeamConfig {
  if (playersPerSide === 4) {
    return {
      totalSlots: 12,
      defaultDividers: [4, 8],
      dividerPresets: [
        { label: "3 Lines (4/4/4)", dividers: [4, 8] },
        { label: "2 Lines (6/6)",   dividers: [6] },
        { label: "No Split",        dividers: [] },
      ],
      minPoints: 30,
      defaultPoints: 40,
      maxPoints: 60,
      rosterSizeLabel: "12-player",
      formatLabel: "4v4",
    }
  }

  // Default: 7v7
  return {
    totalSlots: 24,
    defaultDividers: [8, 16],
    dividerPresets: [
      { label: "3 Lines (8/8/8)",   dividers: [8, 16] },
      { label: "3 Lines (10/7/7)",  dividers: [10, 17] },
      { label: "2 Lines (12/12)",   dividers: [12] },
      { label: "No Split",          dividers: [] },
    ],
    minPoints: 29,
    defaultPoints: 30,
    maxPoints: 40,
    rosterSizeLabel: "24-player",
    formatLabel: "7v7",
  }
}
