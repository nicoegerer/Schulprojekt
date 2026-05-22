// ─────────────────────────────────────────────
// Alle Firebase-Datenbankoperationen für Räume
// ─────────────────────────────────────────────
import { db } from './config'
import {
  ref, set, get, push, onValue, update, remove, serverTimestamp, off
} from 'firebase/database'

// Zufälligen 4-stelligen Raumcode generieren (z.B. "K7X2")
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Raum erstellen
// totalRounds: wie viele Runden gespielt werden
// winMode: 'fastest' (schnellste Einzelrunde) | 'average' (bester Durchschnitt)
export async function createRoom(playerName, totalRounds, winMode) {
  const code = generateRoomCode()
  const playerId = push(ref(db, '_ids')).key

  await set(ref(db, `rooms/${code}`), {
    host: playerId,
    state: 'lobby',
    currentRound: 0,
    totalRounds,
    winMode,
    createdAt: serverTimestamp(),
    players: {
      [playerId]: {
        name: playerName,
        ready: false,
        reactionTime: null,
        tooEarly: false,
        joinedAt: serverTimestamp(),
        rounds: {},
      }
    }
  })

  return { code, playerId }
}

// Raum beitreten
export async function joinRoom(code, playerName) {
  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) throw new Error('Raum nicht gefunden')

  const room = snapshot.val()
  if (room.state !== 'lobby') throw new Error('Spiel läuft bereits')

  const playerCount = Object.keys(room.players || {}).length
  if (playerCount >= 30) throw new Error('Raum ist voll (max. 30)')

  const playerId = push(ref(db, '_ids')).key

  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    name: playerName,
    ready: false,
    reactionTime: null,
    tooEarly: false,
    joinedAt: serverTimestamp(),
    rounds: {},
  })

  return playerId
}

// Host startet eine Runde
export async function startGame(code, roundNumber) {
  const snapshot = await get(ref(db, `rooms/${code}/players`))
  const updates = {}

  // Runden-Ergebnisse zurücksetzen, aber rounds-History behalten
  if (snapshot.exists()) {
    Object.keys(snapshot.val()).forEach(id => {
      updates[`rooms/${code}/players/${id}/ready`] = false
      updates[`rooms/${code}/players/${id}/reactionTime`] = null
      updates[`rooms/${code}/players/${id}/tooEarly`] = false
    })
  }

  updates[`rooms/${code}/state`] = 'countdown'
  updates[`rooms/${code}/currentRound`] = roundNumber
  await update(ref(db), updates)

  // Nach 3s Countdown → warten
  setTimeout(async () => {
    await update(ref(db, `rooms/${code}`), { state: 'waiting' })

    // Zufällige Verzögerung 2–5s → grünes Signal
    const delay = Math.random() * 3000 + 2000
    setTimeout(async () => {
      await update(ref(db, `rooms/${code}`), {
        state: 'ready',
        readyAt: serverTimestamp(),
      })
    }, delay)
  }, 3000)
}

// Spieler schickt sein Ergebnis.
// Wenn ALLE fertig sind → State auf 'results' setzen (Bug-Fix: serverseitig geprüft)
export async function submitResult(code, playerId, reactionTime, tooEarly, currentRound) {
  const updates = {}

  updates[`rooms/${code}/players/${playerId}/reactionTime`] = tooEarly ? null : reactionTime
  updates[`rooms/${code}/players/${playerId}/tooEarly`] = tooEarly
  updates[`rooms/${code}/players/${playerId}/ready`] = true

  // Rundenzeit in der rounds-Map speichern (für Durchschnitt)
  if (!tooEarly && reactionTime != null) {
    updates[`rooms/${code}/players/${playerId}/rounds/${currentRound}`] = reactionTime
  }

  await update(ref(db), updates)

  // Nach dem Schreiben: prüfen ob alle ready → dann results
  const snapshot = await get(ref(db, `rooms/${code}/players`))
  if (!snapshot.exists()) return

  const allDone = Object.values(snapshot.val()).every(p => p.ready === true)
  if (allDone) {
    await update(ref(db, `rooms/${code}`), { state: 'results' })
  }
}

// Spiel komplett beenden → zurück zur Lobby (Host wählt neue Einstellungen)
export async function endGame(code) {
  const snapshot = await get(ref(db, `rooms/${code}/players`))
  if (!snapshot.exists()) return

  const updates = {}
  Object.keys(snapshot.val()).forEach(id => {
    updates[`rooms/${code}/players/${id}/ready`] = false
    updates[`rooms/${code}/players/${id}/reactionTime`] = null
    updates[`rooms/${code}/players/${id}/tooEarly`] = false
    updates[`rooms/${code}/players/${id}/rounds`] = {}
  })
  updates[`rooms/${code}/state`] = 'lobby'
  updates[`rooms/${code}/currentRound`] = 0
  updates[`rooms/${code}/readyAt`] = null

  await update(ref(db), updates)
}

// Spieler verlässt den Raum
export async function leaveRoom(code, playerId) {
  await remove(ref(db, `rooms/${code}/players/${playerId}`))
}

// Echtzeit-Listener auf einen Raum
export function listenToRoom(code, callback) {
  const roomRef = ref(db, `rooms/${code}`)
  onValue(roomRef, snapshot => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
  return () => off(roomRef)
}

// ── Hilfsfunktionen für Auswertung ──────────────────────────────────────────

// Durchschnitt aller Rundenzeiten eines Spielers
export function getAverage(player) {
  const times = Object.values(player.rounds || {}).filter(t => t != null)
  if (times.length === 0) return null
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
}

// Beste Einzelzeit eines Spielers
export function getBestRound(player) {
  const times = Object.values(player.rounds || {}).filter(t => t != null)
  if (times.length === 0) return null
  return Math.min(...times)
}

// Spieler nach Gewinnmodus sortieren
export function sortPlayers(players, winMode) {
  return [...players].sort((a, b) => {
    const aVal = winMode === 'average' ? getAverage(a) : getBestRound(a)
    const bVal = winMode === 'average' ? getAverage(b) : getBestRound(b)
    if (aVal == null) return 1
    if (bVal == null) return -1
    return aVal - bVal
  })
}