import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gamesheet",
  description: "Live game sheet for mixed ultimate frisbee",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gamesheet",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7c3aed",
}

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var root = document.documentElement;
      if (stored === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (stored === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
      } else {
        root.classList.remove('light', 'dark');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        }
      }
    } catch (e) {}
  })();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
