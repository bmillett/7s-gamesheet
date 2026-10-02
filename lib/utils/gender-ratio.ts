/**
 * lib/utils/gender-ratio.ts
 *
 * Gender ratio utilities for 7v7 mixed ultimate.
 *
 * The ABBAABBAA alternating pattern is period-4:
 *   [A, B, B, A,  A, B, B, A,  ...]
 *   idx: 0  1  2  3  4  5  6  7
 *
 * For point index i:
 *   ratio is A  when  i % 4 === 0 or i % 4 === 3
 *   ratio is B  when  i % 4 === 1 or i % 4 === 2
 *
 * startingRatio determines which gender has 4 on point 0.
 *   "4fmp-3mmp"  →  A = 4 FMP / 3 MMP,  B = 3 FMP / 4 MMP
 *   "3fmp-4mmp"  →  A = 3 FMP / 4 MMP,  B = 4 FMP / 3 MMP
 */

export type StartingRatio = "4fmp-3mmp" | "3fmp-4mmp"

export interface GenderCount {
  fmp: number
  mmp: number
  unknown: number
}

export interface ExpectedRatio {
  fmp: number
  mmp: number
}

export type RatioStatus = "ok" | "wrong" | "incomplete" | "disabled"

/** Returns the expected FMP/MMP counts for a given point index and starting ratio. */
export function getExpectedRatio(pointIndex: number, startingRatio: StartingRatio): ExpectedRatio {
  const mod = pointIndex % 4
  const isA = mod === 0 || mod === 3

  if (startingRatio === "4fmp-3mmp") {
    return isA ? { fmp: 4, mmp: 3 } : { fmp: 3, mmp: 4 }
  } else {
    return isA ? { fmp: 3, mmp: 4 } : { fmp: 4, mmp: 3 }
  }
}

/**
 * Counts FMP / MMP / unknown among a set of player IDs.
 * allPlayers is any iterable with id + gender fields.
 */
export function countGenders(
  playerIds: string[],
  allPlayers: Array<{ id: string; gender: string }>
): GenderCount {
  const genderMap = new Map(allPlayers.map((p) => [p.id, p.gender]))
  let fmp = 0
  let mmp = 0
  let unknown = 0

  for (const id of playerIds) {
    const g = genderMap.get(id) ?? ""
    if (g === "FMP") fmp++
    else if (g === "MMP") mmp++
    else unknown++
  }

  return { fmp, mmp, unknown }
}

/**
 * Returns the ratio status for a point.
 *   "ok"         — correct ratio and exactly 7 players
 *   "wrong"      — 7 players but wrong gender split
 *   "incomplete" — fewer than 7 players (no error state yet)
 *   "disabled"   — ratio enforcement is off
 */
export function getRatioStatus(
  pointIndex: number,
  startingRatio: StartingRatio,
  playerIds: string[],
  allPlayers: Array<{ id: string; gender: string }>
): RatioStatus {
  if (playerIds.length < 7) return "incomplete"

  const { fmp, mmp, unknown } = countGenders(playerIds, allPlayers)
  if (unknown > 0) return "wrong" // unknown gender counts as a violation

  const expected = getExpectedRatio(pointIndex, startingRatio)
  return fmp === expected.fmp && mmp === expected.mmp ? "ok" : "wrong"
}

/**
 * Returns true if adding this player (FMP) would be filling a slot that
 * should be MMP — i.e. the point already has the full FMP quota and the
 * player being added is FMP.
 */
export function isFmpAsMmp(
  playerIdToAdd: string,
  currentPlayerIds: string[],
  pointIndex: number,
  startingRatio: StartingRatio,
  allPlayers: Array<{ id: string; gender: string }>
): boolean {
  const genderMap = new Map(allPlayers.map((p) => [p.id, p.gender]))
  const incomingGender = genderMap.get(playerIdToAdd) ?? ""
  if (incomingGender !== "FMP") return false

  const { fmp } = countGenders(currentPlayerIds, allPlayers)
  const expected = getExpectedRatio(pointIndex, startingRatio)

  // FMP quota is already full — this player would overflow it
  return fmp >= expected.fmp
}
