// Startbildschirm: Name eingeben, Raum erstellen oder beitreten

import { useState } from 'react'
import { createRoom, joinRoom } from '../firebase/roomService'

export default function LobbyScreen({ onJoined }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState(null)   // 'create' | 'join'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return setError('Gib deinen Namen ein')
    setLoading(true)
    setError('')
    try {
      const { code, playerId } = await createRoom(name.trim())
      onJoined({ code, playerId, playerName: name.trim(), isHost: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError('Gib deinen Namen ein')
    if (!code.trim()) return setError('Gib den Raumcode ein')
    setLoading(true)
    setError('')
    try {
      const playerId = await joinRoom(code.trim().toUpperCase(), name.trim())
      onJoined({ code: code.trim().toUpperCase(), playerId, playerName: name.trim(), isHost: false })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--accent)] mb-3">
          Multiplayer
        </p>
        <h1 className="text-[var(--text-bright)] text-4xl font-extrabold tracking-tight leading-tight">
          Reaction<br />
          <span className="text-[var(--accent)]">Battle</span>
        </h1>
        <p className="text-[var(--text)] text-sm mt-4 max-w-xs mx-auto">
          Trete gegen deine ganze Klasse an — wer hat die schnellsten Reflexe?
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">

        {/* Name input */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--text)] mb-2 font-mono">
            Dein Name
          </label>
          <input
            type="text"
            maxLength={20}
            placeholder="z.B. Max"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-bright)] placeholder-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
          />
        </div>

        {/* Mode toggle */}
        {!mode && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setMode('create')}
              className="py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all"
            >
              Raum erstellen
            </button>
            <button
              onClick={() => setMode('join')}
              className="py-3 rounded-xl border border-[var(--border)] text-[var(--text-bright)] font-semibold text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95 transition-all"
            >
              Beitreten
            </button>
          </div>
        )}

        {/* Create mode */}
        {mode === 'create' && (
          <div className="space-y-3">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Wird erstellt …' : 'Raum erstellen'}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-xs text-[var(--text)] hover:text-[var(--text-bright)] transition-colors py-1">
              ← Zurück
            </button>
          </div>
        )}

        {/* Join mode */}
        {mode === 'join' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--text)] mb-2 font-mono">
                Raumcode
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="z.B. K7X2"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--accent)] placeholder-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm font-mono tracking-widest uppercase text-center"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Trete bei …' : 'Beitreten'}
            </button>
            <button onClick={() => setMode(null)} className="w-full text-xs text-[var(--text)] hover:text-[var(--text-bright)] transition-colors py-1">
              ← Zurück
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[var(--red)] text-sm text-center font-mono animate-slide-up">
            ⚠ {error}
          </p>
        )}
      </div>
    </div>
  )
}
