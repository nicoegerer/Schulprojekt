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

// Raum erstellen – gibt den Raumcode zurück
export async function createRoom(playerName) {
  const code = generateRoomCode()
  const playerId = push(ref(db, '_ids')).key

  await set(ref(db, `rooms/${code}`), {
    host: playerId,
    state: 'lobby',      // lobby | countdown | waiting | ready | results
    createdAt: serverTimestamp(),
    players: {
      [playerId]: {
        name: playerName,
        ready: false,
        reactionTime: null,
        tooEarly: false,
        joinedAt: serverTimestamp(),
      }
    }
  })

  return { code, playerId }
}

// Raum beitreten – gibt playerId zurück oder wirft Fehler
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
  })

  return playerId
}

// Host startet Countdown → Spiel beginnt für alle
export async function startGame(code) {
  // Phase 1: Countdown (3 Sekunden UI-seitig)
  await update(ref(db, `rooms/${code}`), { state: 'countdown' })

  // Phase 2: Nach 3s → alle warten auf grünes Signal
  setTimeout(async () => {
    await update(ref(db, `rooms/${code}`), { state: 'waiting' })

    // Phase 3: Zufällige Verzögerung 2–5s → grünes Signal
    const delay = Math.random() * 3000 + 2000
    setTimeout(async () => {
      await update(ref(db, `rooms/${code}`), {
        state: 'ready',
        readyAt: serverTimestamp(),
      })
    }, delay)
  }, 3000)
}

// Spieler schickt sein Ergebnis (Reaktionszeit oder tooEarly)
export async function submitResult(code, playerId, reactionTime, tooEarly = false) {
  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    reactionTime: tooEarly ? null : reactionTime,
    tooEarly,
    ready: true,
  })
}

// Host setzt Spiel auf Lobby zurück für nächste Runde
export async function resetRoom(code) {
  const snapshot = await get(ref(db, `rooms/${code}/players`))
  if (!snapshot.exists()) return

  const updates = {}
  Object.keys(snapshot.val()).forEach(id => {
    updates[`rooms/${code}/players/${id}/reactionTime`] = null
    updates[`rooms/${code}/players/${id}/tooEarly`] = false
    updates[`rooms/${code}/players/${id}/ready`] = false
  })
  updates[`rooms/${code}/state`] = 'lobby'
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
  onValue(roomRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null)
  })
  // Gibt Cleanup-Funktion zurück
  return () => off(roomRef)
}
