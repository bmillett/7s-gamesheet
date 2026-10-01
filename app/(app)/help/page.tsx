export const dynamic = "force-dynamic"

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold text-foreground">Help & User Guide</h1>
        <p className="text-xs text-muted-foreground mt-0.5">How to use the 7s Gamesheet app</p>
      </div>

      {/* Roster */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span>👥</span> Roster Page
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up your 24-player roster before your first game. Players marked <strong className="text-foreground">Active</strong> will appear in the gamesheet bench pool.
        </p>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Add player</span>
            <span className="text-muted-foreground">Click <strong className="text-foreground">+ Add Player</strong> at the bottom of the table. Click the name field to type it in, then press Enter or click Save.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Jersey #</span>
            <span className="text-muted-foreground">Type a 1 or 2 digit number. Digits only, max 2 characters.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Gender</span>
            <span className="text-muted-foreground"><strong className="text-pink-600">FMP</strong> = Female Matching Player, <strong className="text-blue-600">MMP</strong> = Male Matching Player. Shown as a coloured dot on the bench and live mode.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Position</span>
            <span className="text-muted-foreground">Handler (H), Cutter (C), or Hybrid (HY). Shown as an abbreviated badge on bench cards.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Active</span>
            <span className="text-muted-foreground">Toggle Yes/No. Only active players appear in the gamesheet bench. Deactivate players who are unavailable for a tournament.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Order</span>
            <span className="text-muted-foreground">Use the ↑ ↓ arrows to reorder players. This determines slot order in the gamesheet grid.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-28 shrink-0">Bulk import</span>
            <span className="text-muted-foreground">Click <strong className="text-foreground">Bulk import via CSV paste</strong> and enter one player per line: <code className="bg-muted px-1 rounded text-xs">7, Jane Doe, Handler</code></span>
          </div>
        </div>
      </section>

      {/* Sheets */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span>📋</span> Sheets Page
        </h2>
        <p className="text-sm text-muted-foreground">
          Each game gets its own sheet. Sheets store the 24-slot lineup, point-by-point scores, and player stats.
        </p>

        <h3 className="text-sm font-semibold text-foreground pt-1">Managing sheets</h3>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">New sheet</span>
            <span className="text-muted-foreground">Click <strong className="text-foreground">+ New Blank Sheet</strong>. Fill in the Tournament, Opponent, and Field fields at the top.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Use as template</span>
            <span className="text-muted-foreground">Duplicates the current roster layout and line dividers into a new sheet with scores reset — useful for back-to-back games.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Archive sheet</span>
            <span className="text-muted-foreground">Locks the sheet as read-only for historical reference. Archived sheets move to the Archived tab. You can unlock and edit them again at any time.</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground pt-1">Setting up the lineup</h3>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Bench</span>
            <span className="text-muted-foreground">Click <strong className="text-foreground">👥 Bench</strong> to show the player pool. Each card shows jersey number, a gender dot (pink=FMP, blue=MMP), name, and position abbreviation.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Assign players</span>
            <span className="text-muted-foreground">Drag a player from the bench to any row in the grid, or click a player card then click a target row. Drag between rows to swap.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Line splits</span>
            <span className="text-muted-foreground">Click <strong className="text-foreground">✂ Line Splits</strong> to configure line dividers. Default is 8/8/8 (rows 1–8, 9–16, 17–24). Other presets: 10/7/7, 2 Lines 12/12, or No Split.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Mark out/injured</span>
            <span className="text-muted-foreground">Click the 🩹 button on a bench card to mark a player as out. They will be crossed out and excluded from point tracking.</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground pt-1">Scoring points (grid view)</h3>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Record players</span>
            <span className="text-muted-foreground">Click a checkbox in the grid to mark that player as on for that point. The Pts column tracks total points played per player.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Score row</span>
            <span className="text-muted-foreground">The coloured score rows at the bottom of the grid track running totals. Click a cell to toggle a score for that point.</span>
          </div>
        </div>
      </section>

      {/* Live mode */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span>⚡</span> Live Game Mode (Sideline)
        </h2>
        <p className="text-sm text-muted-foreground">
          Tap <strong className="text-foreground">⚡ Live Game Mode</strong> to switch to a large-format sideline view optimised for phones and tablets.
        </p>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Score a point</span>
            <span className="text-muted-foreground">Tap <strong className="text-emerald-600">+1 Us</strong> or <strong className="text-rose-600">+1 Them</strong>. The running score updates instantly. Tap again to undo.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Set on-field players</span>
            <span className="text-muted-foreground">Tap individual player cards to toggle them on/off field, or tap the <strong className="text-foreground">Line 1 / Line 2 / Line 3</strong> badge to add the whole line at once.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Starting possession</span>
            <span className="text-muted-foreground">Set O-Line or D-Line at the start of the game. Hold/Break outcomes are derived automatically from this.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Hold / Break</span>
            <span className="text-muted-foreground">Shown automatically after scoring. Use the Hold/Break checkboxes to manually override if the auto-detection is wrong.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Stats panel</span>
            <span className="text-muted-foreground">Opens automatically after we score a point. Record goal scorer, assist, D-blocks, throwaways, and drops per player.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Navigate points</span>
            <span className="text-muted-foreground">Use the point list on the left to jump back to any previous point and review or edit the lineup and stats.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Timeouts</span>
            <span className="text-muted-foreground">Track 1st and 2nd half timeouts for both teams using the timeout panel below the lineup.</span>
          </div>
        </div>
      </section>

      {/* Offline */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span>📶</span> Offline Use
        </h2>
        <p className="text-sm text-muted-foreground">
          The app works offline. Changes are saved locally and synced to the server when you are back online. The sync badge in the top-right corner shows the current status.
        </p>
        <div className="rounded-lg border border-border divide-y divide-border text-sm">
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Precache</span>
            <span className="text-muted-foreground">Before heading to a venue with no internet, click the <strong className="text-foreground">📥 Precache</strong> button in the sync badge to save all current sheets and roster to your device.</span>
          </div>
          <div className="p-3 flex gap-3">
            <span className="font-semibold text-foreground w-36 shrink-0">Install as app</span>
            <span className="text-muted-foreground">On iOS: tap the Share button then <strong className="text-foreground">Add to Home Screen</strong>. On Android: tap the browser menu then <strong className="text-foreground">Install App</strong>.</span>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <span>📊</span> Game Summary
        </h2>
        <p className="text-sm text-muted-foreground">
          Tap <strong className="text-foreground">📊 Summary &amp; Stats</strong> at any time to open the post-game summary. It shows the final score, holds/breaks breakdown, and a full per-player stat table with goals, assists, D-blocks, throwaways, drops, O-line/D-line splits, and point +/-.
        </p>
      </section>
    </div>
  )
}
