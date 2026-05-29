import { useState, useEffect, useRef, useCallback } from 'react'

// --- Game States ---
// 'idle'    → Startscreen
// 'waiting' → Waiting for the green flash (random delay)
// 'ready'   → GREEN! Click now!
// 'result'  → Show reaction time
// 'toosoon' → Clicked too early

const BEST_SCORES_KEY = 'reactiongame_best'

function getBest() {
  try {
    const val = localStorage.getItem(BEST_SCORES_KEY)
    return val ? JSON.parse(val) : []
  } catch {
    return []
  }
}

function saveBest(times) {
  try {
    const sorted = [...times].sort((a, b) => a - b).slice(0, 5)
    localStorage.setItem(BEST_SCORES_KEY, JSON.stringify(sorted))
    return sorted
  } catch {
    return times
  }
}

function getRating(ms) {
  if (ms < 180) return { label: '🏆 Legendary', color: 'text-yellow-300' }
  if (ms < 230) return { label: '⚡ Blitz', color: 'text-lime-400' }
  if (ms < 300) return { label: '✅ Solid', color: 'text-green-400' }
  if (ms < 400) return { label: '👍 Average', color: 'text-blue-400' }
  return { label: '🐢 Slow', color: 'text-orange-400' }
}

export default function App() {
  const [phase, setPhase] = useState('idle')
  const [reactionTime, setReactionTime] = useState(null)
  const [bestTimes, setBestTimes] = useState(getBest)
  const [round, setRound] = useState(0)

  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const startGame = useCallback(() => {
    setPhase('waiting')
    setReactionTime(null)

    const delay = 1500 + Math.random() * 3500 // 1.5s – 5s
    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }, [])

  const handleClick = useCallback(() => {
    if (phase === 'idle' || phase === 'result' || phase === 'toosoon') {
      startGame()
      return
    }

    if (phase === 'waiting') {
      clearTimeout(timerRef.current)
      setPhase('toosoon')
      return
    }

    if (phase === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current)
      setReactionTime(elapsed)
      setPhase('result')
      setRound(r => r + 1)

      setBestTimes(prev => {
        const updated = saveBest([...prev, elapsed])
        return updated
      })
    }
  }, [phase, startGame])

  const personalBest = bestTimes.length > 0 ? Math.min(...bestTimes) : null
  const rating = reactionTime ? getRating(reactionTime) : null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center select-none cursor-pointer transition-colors duration-300"
      style={{ background: getBgColor(phase) }}
      onClick={handleClick}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 opacity-60">
        <span className="font-mono text-xs tracking-widest uppercase text-white/50">
          Reaction Game
        </span>
        {personalBest && (
          <span className="font-mono text-xs text-white/50">
            PB: <span className="text-lime-400">{personalBest}ms</span>
          </span>
        )}
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        {phase === 'idle' && <IdleScreen />}
        {phase === 'waiting' && <WaitingScreen />}
        {phase === 'ready' && <ReadyScreen />}
        {phase === 'result' && (
          <ResultScreen
            time={reactionTime}
            rating={rating}
            round={round}
            bestTimes={bestTimes}
          />
        )}
        {phase === 'toosoon' && <TooSoonScreen />}
      </main>

      {/* Footer hint */}
      <footer className="absolute bottom-6 text-white/20 text-xs font-mono tracking-widest">
        {phase === 'idle' ? 'CLICK ANYWHERE TO START' : phase === 'waiting' ? 'WAIT...' : phase === 'ready' ? 'CLICK!' : 'CLICK TO PLAY AGAIN'}
      </footer>
    </div>
  )
}

function getBgColor(phase) {
  switch (phase) {
    case 'idle':    return '#0a0a0a'
    case 'waiting': return '#111827'
    case 'ready':   return '#14532d'
    case 'result':  return '#0a0a0a'
    case 'toosoon': return '#450a0a'
    default:        return '#0a0a0a'
  }
}

function IdleScreen() {
  return (
    <>
      <div className="text-8xl animate-bounce">⚡</div>
      <h1 className="text-4xl md:text-5xl font-bold font-mono text-white tracking-tight">
        Reaction<br />
        <span className="text-lime-400">Game</span>
      </h1>
      <p className="text-white/40 font-mono text-sm max-w-xs">
        Wait for the screen to turn green.<br />Then click as fast as you can.
      </p>
    </>
  )
}

function WaitingScreen() {
  return (
    <>
      <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
        <span className="text-4xl">👁</span>
      </div>
      <p className="text-white/60 font-mono text-lg tracking-widest">
        Wait for green...
      </p>
    </>
  )
}

function ReadyScreen() {
  return (
    <>
      <div className="text-8xl animate-ping absolute opacity-30">🟢</div>
      <div className="text-8xl">🟢</div>
      <p className="text-white font-mono text-2xl font-bold tracking-widest animate-pulse">
        CLICK NOW!
      </p>
    </>
  )
}

function ResultScreen({ time, rating, round, bestTimes }) {
  const isNewBest = bestTimes[0] === time && bestTimes.filter(t => t === time).length === 1

  return (
    <div className="flex flex-col items-center gap-6 animate-fadeIn">
      {isNewBest && (
        <div className="text-yellow-300 font-mono text-xs tracking-widest uppercase animate-bounce">
          🏆 New Personal Best!
        </div>
      )}

      <div className="text-7xl md:text-8xl font-bold font-mono text-white">
        {time}
        <span className="text-2xl text-white/40 ml-2">ms</span>
      </div>

      <div className={`font-mono text-xl font-bold ${rating.color}`}>
        {rating.label}
      </div>

      {/* Best times */}
      {bestTimes.length > 1 && (
        <div className="mt-2 border border-white/10 rounded-lg p-4 w-48">
          <p className="text-white/30 text-xs font-mono mb-2 text-center">BEST TIMES</p>
          {bestTimes.slice(0, 5).map((t, i) => (
            <div key={i} className="flex justify-between font-mono text-sm">
              <span className="text-white/30">#{i + 1}</span>
              <span className={t === Math.min(...bestTimes) ? 'text-lime-400' : 'text-white/60'}>
                {t}ms
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-white/30 font-mono text-xs">
        Round {round} · Click to play again
      </p>
    </div>
  )
}

function TooSoonScreen() {
  return (
    <>
      <div className="text-7xl">🔴</div>
      <h2 className="text-3xl font-bold font-mono text-red-400">
        Too soon!
      </h2>
      <p className="text-white/40 font-mono text-sm">
        You clicked before the signal.<br />Wait for green next time.
      </p>
    </>
  )
}
