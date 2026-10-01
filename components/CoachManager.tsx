"use client"

import { useState, useTransition } from "react"
import { addCoachAction, removeCoachAction } from "@/lib/data/actions"
import type { TeamMember } from "@/types/types"

interface CoachManagerProps {
  teamId: string
  currentUserId: string
  initialMembers: TeamMember[]
}

export function CoachManager({ teamId, currentUserId, initialMembers }: CoachManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) {
      setError("Please enter an email address.")
      return
    }

    startTransition(async () => {
      const res = await addCoachAction(teamId, email, password)
      if (res?.error) {
        setError(res.error)
        return
      }

      setSuccess(`Coach ${email} added successfully!`)
      setEmail("")
      setPassword("")
      // Optimistically add to members list
      setMembers((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          team_id: teamId,
          user_id: "",
          email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
        },
      ])
    })
  }

  function handleRemove(memberId: string) {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const res = await removeCoachAction(teamId, memberId)
      if (res?.error) {
        setError(res.error)
        setConfirmRemoveId(null)
        return
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      setConfirmRemoveId(null)
      setSuccess("Coach removed.")
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Add Coach Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground">Add Coach to Team</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter the coach&apos;s email and password. If the user doesn&apos;t exist yet, an account will be created automatically.
          </p>
        </div>

        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Coach Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min 6 characters)"
              required
              minLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          {success && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Adding..." : "+ Add Coach"}
          </button>
        </form>
      </div>

      {/* Current Team Coaches */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Current Team Coaches</h2>
        <div className="divide-y divide-border">
          {members.map((m) => {
            const isMe = m.user_id === currentUserId
            const isConfirming = confirmRemoveId === m.id
            return (
              <div key={m.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{m.email}</span>
                  {isMe && (
                    <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
                      You
                    </span>
                  )}
                </div>
                {!isMe && (
                  isConfirming ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Remove?</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1 rounded bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90 disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        disabled={isPending}
                        className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(m.id)}
                      disabled={isPending}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
