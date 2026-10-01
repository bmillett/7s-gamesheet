"use client"

import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2.5 min-h-[44px] flex items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      Sign out
    </button>
  )
}
