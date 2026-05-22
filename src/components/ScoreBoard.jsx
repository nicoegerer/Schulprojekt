// ScoreBoard zeigt Highscore, Durchschnitt und Rundenhistorie an

export default function ScoreBoard({ results }) {
  if (results.length === 0) return null

  const best = Math.min(...results)
  const average = Math.round(results.reduce((a, b) => a + b, 0) / results.length)

  return (
    <div className="w-full max-w-md animate-slide-up">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Bestzeit" value={best} unit="ms" highlight />
        <StatCard label="Durchschnitt" value={average} unit="ms" />
      </div>

      {/* Round history */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="text-xs uppercase tracking-widest text-[var(--text)]">
            Runden — {results.length}
          </p>
        </div>
        <ul className="divide-y divide-[var(--border)] max-h-40 overflow-y-auto">
          {[...results].reverse().map((ms, i) => {
            const round = results.length - i
            const isBest = ms === best
            return (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-[var(--text)] text-sm font-mono">
                  Runde {round}
                </span>
                <span className={`font-mono text-sm font-bold ${isBest ? 'text-[var(--accent)]' : 'text-[var(--text-bright)]'}`}>
                  {ms} ms{isBest && <span className="ml-1 text-xs">★</span>}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// --- Kleine Stat-Karte ---
function StatCard({ label, value, unit, highlight }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 text-center ${
      highlight
        ? 'border-[var(--accent-border)] bg-[var(--accent-dim)]'
        : 'border-[var(--border)] bg-[var(--surface)]'
    }`}>
      <p className="text-xs uppercase tracking-widest text-[var(--text)] mb-1">{label}</p>
      <p className={`font-mono text-2xl font-bold ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text-bright)]'}`}>
        {value}
        <span className="text-sm font-normal ml-1 text-[var(--text)]">{unit}</span>
      </p>
    </div>
  )
}
