import { useState, useEffect, useRef } from 'react'

// Possible states the game can be in
const STATES = {
  IDLE: 'idle',       // Before game starts
  WAITING: 'waiting', // Waiting for green signal
  READY: 'ready',     // Green! Click now!
  RESULT: 'result',   // Showing reaction time
  TOO_EARLY: 'tooEarly', // Player clicked too soon
}

export default function ReactionBox({ onResult }) {
  const [gameState, setGameState] = useState(STATES.IDLE)
  const [reactionTime, setReactionTime] = useState(null)

  // Refs to track timers and timestamps
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  function startGame() {
    setGameState(STATES.WAITING)
    setReactionTime(null)

    // Random delay between 2000–5000ms
    const delay = Math.random() * 3000 + 2000

    timerRef.current = setTimeout(() => {
      startTimeRef.current = Date.now()
      setGameState(STATES.READY)
    }, delay)
  }

  function handleBoxClick() {
    if (gameState === STATES.IDLE || gameState === STATES.RESULT) return

    if (gameState === STATES.WAITING) {
      // Clicked before green — too early!
      clearTimeout(timerRef.current)
      setGameState(STATES.TOO_EARLY)
      return
    }

    if (gameState === STATES.READY) {
      const elapsed = Date.now() - startTimeRef.current
      setReactionTime(elapsed)
      setGameState(STATES.RESULT)
      onResult(elapsed) // Pass result up to App
    }
  }

  function resetGame() {
    clearTimeout(timerRef.current)
    setGameState(STATES.IDLE)
    setReactionTime(null)
  }

  // --- Box appearance based on state ---
  const boxStyles = {
    [STATES.IDLE]: 'bg-[var(--surface)] border-[var(--border)] cursor-default',
    [STATES.WAITING]: 'bg-[var(--surface-2)] border-[var(--border)] cursor-pointer',
    [STATES.READY]: 'bg-[var(--accent-dim)] border-[var(--accent-border)] cursor-pointer [animation:pulse-green_1.5s_infinite]',
    [STATES.RESULT]: 'bg-[var(--surface)] border-[var(--border)] cursor-default',
    [STATES.TOO_EARLY]: 'bg-[var(--red-dim)] border-[var(--red)] cursor-pointer',
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      {/* The main reaction area */}
      <div
        onClick={handleBoxClick}
        className={`
          w-full h-64 rounded-2xl border-2 flex flex-col items-center justify-center
          select-none transition-all duration-200
          ${boxStyles[gameState]}
        `}
      >
        <BoxContent
          gameState={gameState}
          reactionTime={reactionTime}
          STATES={STATES}
        />
      </div>

      {/* Action buttons */}
      <ActionButton
        gameState={gameState}
        STATES={STATES}
        onStart={startGame}
        onReset={resetGame}
      />
    </div>
  )
}

// --- Sub-component: Content inside the box ---
function BoxContent({ gameState, reactionTime, STATES }) {
  if (gameState === STATES.IDLE) {
    return (
      <p className="text-[var(--text)] text-lg tracking-wide">
        Drücke Start, um zu spielen
      </p>
    )
  }

  if (gameState === STATES.WAITING) {
    return (
      <>
        <div className="w-3 h-3 rounded-full bg-[var(--yellow)] mb-4 animate-pulse" />
        <p className="text-[var(--yellow)] font-semibold text-lg tracking-wide">
          Warte auf Grün …
        </p>
        <p className="text-[var(--text)] text-sm mt-2">Noch nicht klicken!</p>
      </>
    )
  }

  if (gameState === STATES.READY) {
    return (
      <p className="text-[var(--accent)] font-bold text-3xl tracking-widest animate-count">
        JETZT!
      </p>
    )
  }

  if (gameState === STATES.TOO_EARLY) {
    return (
      <>
        <p className="text-[var(--red)] font-bold text-2xl animate-count">Zu früh geklickt!</p>
        <p className="text-[var(--text)] text-sm mt-3">Warte auf das grüne Signal</p>
      </>
    )
  }

  if (gameState === STATES.RESULT) {
    return (
      <div className="text-center animate-slide-up">
        <p className="text-[var(--text)] text-sm uppercase tracking-widest mb-2">Reaktionszeit</p>
        <p className="font-mono text-[var(--accent)] text-5xl font-bold">
          {reactionTime}
          <span className="text-2xl ml-1 text-[var(--text)]">ms</span>
        </p>
        <p className="text-[var(--text)] text-sm mt-3">{getRating(reactionTime)}</p>
      </div>
    )
  }

  return null
}

// --- Sub-component: Buttons below the box ---
function ActionButton({ gameState, STATES, onStart, onReset }) {
  if (gameState === STATES.IDLE) {
    return (
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-base tracking-wide hover:brightness-110 active:scale-95 transition-all duration-150"
      >
        Start
      </button>
    )
  }

  if (gameState === STATES.RESULT || gameState === STATES.TOO_EARLY) {
    return (
      <button
        onClick={onReset}
        className="px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--text-bright)] font-semibold text-base tracking-wide hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95 transition-all duration-150"
      >
        Nochmal
      </button>
    )
  }

  return null
}

// --- Helper: Simple rating based on reaction time ---
function getRating(ms) {
  if (ms < 200) return '⚡ Blitzschnell!'
  if (ms < 300) return '🎯 Sehr gut!'
  if (ms < 400) return '👍 Gut!'
  if (ms < 500) return '🙂 Okay!'
  return '🐢 Trainiere weiter!'
}
