"use client"

/**
 * Receives teamId as a prop so the server layout can render:
 *   <TeamBoundary teamId={team.id}>{children}</TeamBoundary>
 *
 * The key is set by the server layout on this component element,
 * causing React to fully unmount + remount all children whenever
 * the active team changes — ensuring no client component holds
 * stale state from a previous team.
 */
export function TeamBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
