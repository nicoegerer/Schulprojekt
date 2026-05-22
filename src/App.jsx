import { useState } from 'react'
import ReactionBox from './components/ReactionBox'
import ScoreBoard from './components/ScoreBoard'

export default function App() {
  // Speichert alle Reaktionszeiten aus vergangenen Runden
  const [results, setResults] = useState([])

  function handleResult(ms) {
    setResults(prev => [...prev, ms])
  }

  function handleReset() {
    setResults([])
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8">
      {/* Header */}
      <header className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)] mb-3">
          Reaktionstest
        </p>
        <h1 className="text-[var(--text-bright)] text-4xl font-extrabold tracking-tight leading-none">
          Wie schnell<br />
          <span className="text-[var(--accent)]">reagierst du?</span>
        </h1>
        <p className="text-[var(--text)] text-sm mt-4 max-w-xs mx-auto leading-relaxed">
          Klicke das Feld sobald es grün wird — so schnell wie möglich.
        </p>
      </header>

      {/* Game area */}
      <ReactionBox onResult={handleResult} />

      {/* Score board — nur sichtbar wenn mind. 1 Runde gespielt */}
      <ScoreBoard results={results} />

      {/* Reset all rounds */}
      {results.length > 1 && (
        <button
          onClick={handleReset}
          className="text-xs text-[var(--text)] hover:text-[var(--red)] underline underline-offset-4 transition-colors"
        >
          Alle Ergebnisse löschen
        </button>
      )}

      {/* Footer */}
      <footer className="text-[var(--text)] text-xs font-mono opacity-40 mt-4">
        Schulprojekt · React + Vite + Tailwind
      </footer>
    </main>
  )
}
