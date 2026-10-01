/**
 * lib/utils/haptics.ts
 *
 * Tactile haptic feedback utilities using the standard Vibration API.
 * Safely degrades when navigator.vibrate is unsupported.
 */

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning") {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.vibrate) {
    return
  }

  try {
    switch (type) {
      case "light":
        navigator.vibrate(12) // Quick subtle tick for roster toggles
        break
      case "medium":
        navigator.vibrate(28) // Score button tap
        break
      case "heavy":
        navigator.vibrate(45) // Timeouts / point complete
        break
      case "success":
        navigator.vibrate([20, 40, 20]) // Hold/Break or sync success
        break
      case "warning":
        navigator.vibrate([40, 60, 40]) // Reset or error
        break
    }
  } catch {
    // Ignore permissions/policy errors
  }
}

