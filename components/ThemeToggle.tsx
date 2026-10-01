"use client"

import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  function toggleTheme() {
    const nextTheme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system"
    setTheme(nextTheme)

    const root = document.documentElement
    if (nextTheme === "system") {
      localStorage.removeItem("theme")
      root.classList.remove("light", "dark")
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark")
      }
    } else if (nextTheme === "dark") {
      localStorage.setItem("theme", "dark")
      root.classList.remove("light")
      root.classList.add("dark")
    } else {
      localStorage.setItem("theme", "light")
      root.classList.remove("dark")
      root.classList.add("light")
    }
  }

  // Label / icon according to mode
  const icon = !mounted ? "🌓" : theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🌓"
  const title = !mounted
    ? "Theme (System)"
    : theme === "dark"
    ? "Theme: Dark (Click for Light)"
    : theme === "light"
    ? "Theme: Light (Click for System)"
    : "Theme: System (Click for Dark)"

  return (
    <button
      onClick={toggleTheme}
      title={title}
      aria-label={title}
      className="px-2.5 py-2.5 min-h-[44px] flex items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    >
      <span className="text-base leading-none">{icon}</span>
    </button>
  )
}
