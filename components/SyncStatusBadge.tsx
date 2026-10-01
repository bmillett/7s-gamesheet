"use client"

/**
 * components/coaches/SyncStatusBadge.tsx
 *
 * Real-time indicator of offline/online status, pending sync queue count,
 * and a manual "Sync Now" button.
 */

import React, { useEffect, useState } from "react"
import { syncEngine, type SyncStatusInfo } from "@/lib/offline/sync-engine"
import { triggerHaptic } from "@/lib/utils/haptics"

interface SyncStatusBadgeProps {
  onPrecache?: () => void
  isPrecaching?: boolean
}

export function SyncStatusBadge({ onPrecache, isPrecaching }: SyncStatusBadgeProps) {
  const [status, setStatus] = useState<SyncStatusInfo>(() => syncEngine.getStatus())

  useEffect(() => {
    return syncEngine.subscribe((newStatus) => {
      setStatus(newStatus)
    })
  }, [])

  const handleManualSync = () => {
    triggerHaptic("medium")
    syncEngine.triggerSync()
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-card/80 backdrop-blur-sm shadow-sm print:hidden">
      {/* Indicator Dot */}
      <span className="relative flex h-2.5 w-2.5">
        {!status.isOnline ? (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
        ) : status.state === "syncing" ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </>
        ) : status.pendingCount > 0 ? (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        )}
      </span>

      {/* Status Label */}
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-foreground">
          {!status.isOnline
            ? "Offline Mode"
            : status.state === "syncing"
            ? "Syncing…"
            : status.pendingCount > 0
            ? `${status.pendingCount} Queued`
            : "Live Synced"}
        </span>
        {status.pendingCount > 0 && (
          <span className="text-muted-foreground text-[11px]">
            ({status.pendingCount} pending)
          </span>
        )}
      </div>

      {/* Manual Sync Trigger */}
      {status.isOnline && status.pendingCount > 0 && (
        <button
          type="button"
          onClick={handleManualSync}
          disabled={status.state === "syncing"}
          className="ml-1 px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
        >
          {status.state === "syncing" ? "Syncing" : "Sync Now"}
        </button>
      )}

      {/* Pre-cache button if provided */}
      {onPrecache && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic("light")
            onPrecache()
          }}
          disabled={isPrecaching}
          className="ml-1 px-2 py-0.5 rounded text-[11px] font-medium border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Save all roster & sheets to local device for offline field use"
        >
          {isPrecaching ? "Saving…" : "📥 Precache"}
        </button>
      )}
    </div>
  )
}


