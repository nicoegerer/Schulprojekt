// Startbildschirm: Name eingeben, Raum erstellen oder beitreten
// Beim Erstellen: Rundenanzahl und Gewinnmodus wählen

import { useState } from 'react'
import { createRoom, joinRoom } from '../firebase/roomService'

export default function LobbyScreen({ onJoined }) {
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [mode, setMode]       = useState(null)      // 'create' | 'join'
  const [rounds, setRounds]   = useState(3)          // 1–10
  const [winMode, setWinMode] = useState('fastest')  // 'fastest' | 'average'
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return setError('Gib deinen Namen ein')
    setLoading(true)
    setError('')
    try {
      const { code, playerId } = await createRoom(name.trim(), rounds, winMode)
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

        {/* Name */}
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

        {/* Mode-Auswahl */}
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

        {/* ── Raum erstellen ── */}
        {mode === 'create' && (
          <div className="space-y-4">

            {/* Rundenanzahl */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--text)] mb-2 font-mono">
                Rundenanzahl
              </label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 5, 7, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setRounds(n)}
                    className={`flex-1 py-2 rounded-xl border font-mono font-bold text-sm transition-all ${
                      rounds === n
                        ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Gewinnmodus */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--text)] mb-2 font-mono">
                Gewinnmodus
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWinMode('fastest')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                    winMode === 'fastest'
                      ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]'
                  }`}
                >
                  ⚡ Schnellste<br />
                  <span className="text-xs font-normal opacity-70">Einzelrunde</span>
                </button>

                <button
                  onClick={() => setWinMode('average')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                    winMode === 'average'
                      ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]'
                  }`}
                >
                  📊 Bester<br />
                  <span className="text-xs font-normal opacity-70">Durchschnitt</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--bg)] font-bold text-sm tracking-wide hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Wird erstellt …' : `Raum erstellen (${rounds} Runden)`}
            </button>

            <button
              onClick={() => setMode(null)}
              className="w-full text-xs text-[var(--text)] hover:text-[var(--text-bright)] transition-colors py-1"
            >
              ← Zurück
            </button>
          </div>
        )}

        {/* ── Raum beitreten ── */}
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

            <button
              onClick={() => setMode(null)}
              className="w-full text-xs text-[var(--text)] hover:text-[var(--text-bright)] transition-colors py-1"
            >
              ← Zurück
            </button>
          </div>
        )}

        {/* Fehler */}
        {error && (
          <p className="text-[var(--red)] text-sm text-center font-mono animate-slide-up">
            ⚠ {error}
          </p>
        )}
      </div>
    </div>
  )
}