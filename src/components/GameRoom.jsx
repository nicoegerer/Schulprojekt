// Spielraum: Lobby-Wartebereich → Countdown → Reaktionstest → Ergebnisse

import { useState, useEffect, useRef } from 'react'
import { listenToRoom, startGame, submitResult, resetRoom, leaveRoom } from '../firebase/roomService'

export default function GameRoom({ code, playerId, playerName, isHost, onLeave }) {
  const [room, setRoom] = useState(null)
  const [localState, setLocalState] = useState('waiting') // waiting | clicked | tooEarly
  const [countdown, setCountdown] = useState(3)
  const [myTime, setMyTime] = useState(null)

  const clickTimeRef = useRef(null)
  const countdownRef = useRef(null)
  const hasClickedRef = useRef(false)

  // Firebase Echtzeit-Listener
  useEffect(() => {
    const unsubscribe = listenToRoom(code, setRoom)
    return () => {
      unsubscribe()
      leaveRoom(code, playerId)
    }
  }, [code, playerId])

  // Countdown starten wenn State = 'countdown'
  useEffect(() => {
    if (room?.state !== 'countdown') return

    setCountdown(3)
    setLocalState('waiting')
    hasClickedRef.current = false
    setMyTime(null)

    let c = 3
    countdownRef.current = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) clearInterval(countdownRef.current)
    }, 1000)

    return () => clearInterval(countdownRef.current)
  }, [room?.state])

  // Wenn State auf 'ready' wechselt → Klick-Bereit
  useEffect(() => {
    if (room?.state === 'ready') {
      clickTimeRef.current = Date.now()
    }
  }, [room?.state])

  function handleClick() {
    if (hasClickedRef.current) return
    hasClickedRef.current = true

    if (room?.state === 'waiting' || room?.state === 'countdown') {
      setLocalState('tooEarly')
      submitResult(code, playerId, null, true)
      return
    }

    if (room?.state === 'ready') {
      const ms = Date.now() - clickTimeRef.current
      setMyTime(ms)
      setLocalState('clicked')
      submitResult(code, playerId, ms, false)
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text)] font-mono text-sm animate-pulse">Verbinde …</p>
      </div>
    )
  }

  const players = Object.entries(room.players || {}).map(([id, data]) => ({ id, ...data }))
  const playerCount = players.length

  // ── Ansicht wählen ──────────────────────────────────────────────
  if (room.state === 'lobby') {
    return <LobbyWaiting code={code} players={players} isHost={isHost} playerId={playerId} onStart={() => startGame(code)} onLeave={onLeave} />
  }

  if (room.state === 'countdown') {
    return <CountdownView countdown={countdown} playerCount={playerCount} />
  }

  if (room.state === 'waiting' || room.state === 'ready') {
    return (
      <ReactionView
        gameState={room.state}
        localState={localState}
        myTime={myTime}
        players={players}
        onBoxClick={handleClick}
      />
    )
  }

  if (room.state === 'results') {
    return (
      <ResultsView
        players={players}
        isHost={isHost}
        code={code}
        onReset={() => resetRoom(code)}
        onLeave={onLeave}
      />
    )
  }

  return null
}

// ── Lobby-Wartebereich ──────────────────────────────────────────────────────

function LobbyWaiting({ code, players, isHost, playerId, onStart, onLeave }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-6">
      {/* Raumcode */}
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--text)] mb-2">Raumcode</p>
        <p className="font-mono text-5xl font-bold text-[var(--accent)] tracking-widest">{code}</p>
        <p className="text-[var(--text)] text-sm mt-2">Teile diesen Code mit deiner Klasse</p>
      </div>

      {/* Spielerliste */}
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text)]">Spieler</p>
          <span className="font-mono text-xs text-[var(--accent)]">{players.length} / 30</span>
        </div>
        <ul className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
          {players.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[var(--text-bright)] text-sm flex-1">{p.name}</span>
              {p.id === players[0]?.id && (
                <span className="font-mono text-[10px] text-[var(--accent)] border border-[var(--accent-border)] rounded px-1.5 py-0.5">HOST</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        {isHost ? (
          <button
            onClick={onStart}
            disabled={players.length < 1}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
          >
            Spiel starten →
          </button>
        ) : (
          <p className="text-[var(--text)] text-sm font-mono animate-pulse">Warte auf den Host …</p>
        )}
        <button onClick={onLeave} className="text-xs text-[var(--text)] hover:text-[var(--red)] underline underline-offset-4 transition-colors">
          Raum verlassen
        </button>
      </div>
    </div>
  )
}

// ── Countdown ───────────────────────────────────────────────────────────────

function CountdownView({ countdown, playerCount }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--text)]">{playerCount} Spieler bereit</p>
      <p className="text-[var(--accent)] font-extrabold text-8xl animate-count font-mono" key={countdown}>
        {countdown > 0 ? countdown : '⚡'}
      </p>
      <p className="text-[var(--text)] text-sm">Mach dich bereit …</p>
    </div>
  )
}

// ── Reaktionsfeld ───────────────────────────────────────────────────────────

function ReactionView({ gameState, localState, myTime, players, onBoxClick }) {
  const submittedCount = players.filter(p => p.ready).length

  const boxStyle = {
    waiting: 'bg-[var(--surface-2)] border-[var(--border)] cursor-pointer',
    ready:   'bg-[var(--accent-dim)] border-[var(--accent-border)] cursor-pointer [animation:pulse-green_1.2s_infinite]',
    clicked: 'bg-[var(--surface)] border-[var(--border)] cursor-default',
    tooEarly:'bg-[var(--red-dim)] border-[var(--red)] cursor-default',
  }

  const isGameReady = gameState === 'ready'
  const currentBox  = localState === 'waiting' && isGameReady ? 'ready' : localState

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
      {/* Progress */}
      <p className="font-mono text-xs text-[var(--text)]">
        {submittedCount} / {players.length} geklickt
      </p>

      {/* Box */}
      <div
        onClick={onBoxClick}
        className={`w-full max-w-md h-56 rounded-2xl border-2 flex flex-col items-center justify-center select-none transition-all duration-200 ${boxStyle[currentBox] || boxStyle['waiting']}`}
      >
        {localState === 'waiting' && !isGameReady && (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--yellow)] mb-3 animate-pulse" />
            <p className="text-[var(--yellow)] font-bold">Warte …</p>
            <p className="text-[var(--text)] text-xs mt-1">Noch nicht klicken!</p>
          </>
        )}
        {localState === 'waiting' && isGameReady && (
          <p className="font-mono font-bold text-3xl text-[var(--accent)] tracking-widest animate-count">JETZT!</p>
        )}
        {localState === 'clicked' && (
          <div className="text-center animate-slide-up">
            <p className="font-mono text-[var(--accent)] text-5xl font-bold">{myTime}<span className="text-xl text-[var(--text)] ml-1">ms</span></p>
            <p className="text-[var(--text)] text-sm mt-2">{getRating(myTime)}</p>
            <p className="text-[var(--text)] text-xs mt-3">Warte auf die anderen …</p>
          </div>
        )}
        {localState === 'tooEarly' && (
          <>
            <p className="text-[var(--red)] font-bold text-xl animate-count">Zu früh!</p>
            <p className="text-[var(--text)] text-xs mt-2">Warte auf die Ergebnisse …</p>
          </>
        )}
      </div>

      {/* Mini-Leaderboard: wer hat schon geklickt */}
      <div className="w-full max-w-md">
        <div className="flex flex-wrap gap-2 justify-center">
          {players.map(p => (
            <span
              key={p.id}
              className={`font-mono text-xs px-2 py-1 rounded-lg border transition-all ${
                p.ready
                  ? p.tooEarly
                    ? 'border-[var(--red)] text-[var(--red)] bg-[var(--red-dim)]'
                    : 'border-[var(--accent-border)] text-[var(--accent)] bg-[var(--accent-dim)]'
                  : 'border-[var(--border)] text-[var(--text)]'
              }`}
            >
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Ergebnisse ──────────────────────────────────────────────────────────────

function ResultsView({ players, isHost, code, onReset, onLeave }) {
  // Sortieren: schnellste Zeit zuerst, tooEarly ans Ende
  const sorted = [...players].sort((a, b) => {
    if (a.tooEarly && !b.tooEarly) return 1
    if (!a.tooEarly && b.tooEarly) return -1
    if (a.reactionTime == null) return 1
    if (b.reactionTime == null) return -1
    return a.reactionTime - b.reactionTime
  })

  const winner = sorted.find(p => !p.tooEarly && p.reactionTime != null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-6">
      {/* Gewinner */}
      {winner && (
        <div className="text-center animate-slide-up">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text)] mb-1">Gewinner</p>
          <p className="text-[var(--accent)] text-3xl font-extrabold">{winner.name}</p>
          <p className="font-mono text-[var(--text-bright)] text-xl mt-1">
            {winner.reactionTime} <span className="text-sm text-[var(--text)]">ms</span>
          </p>
        </div>
      )}

      {/* Rangliste */}
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden animate-slide-up">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--text)]">Rangliste</p>
        </div>
        <ul className="divide-y divide-[var(--border)] max-h-80 overflow-y-auto">
          {sorted.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`font-mono text-sm w-6 ${i === 0 && !p.tooEarly ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>
                {p.tooEarly ? '✗' : `#${i + 1}`}
              </span>
              <span className="text-[var(--text-bright)] text-sm flex-1">{p.name}</span>
              <span className={`font-mono text-sm font-bold ${p.tooEarly ? 'text-[var(--red)]' : 'text-[var(--accent)]'}`}>
                {p.tooEarly ? 'zu früh' : p.reactionTime ? `${p.reactionTime} ms` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        {isHost && (
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all"
          >
            Nächste Runde →
          </button>
        )}
        {!isHost && (
          <p className="text-[var(--text)] text-sm font-mono">Warte auf den Host …</p>
        )}
        <button onClick={onLeave} className="text-xs text-[var(--text)] hover:text-[var(--red)] underline underline-offset-4 transition-colors">
          Raum verlassen
        </button>
      </div>
    </div>
  )
}

function getRating(ms) {
  if (ms < 200) return '⚡ Blitzschnell!'
  if (ms < 300) return '🎯 Sehr gut!'
  if (ms < 400) return '👍 Gut!'
  if (ms < 500) return '🙂 Okay!'
  return '🐢 Trainiere weiter!'
}
