// Spielraum: Lobby → Countdown → Reaktionstest → Ergebnisse (mit Rundenlogik)

import { useState, useEffect, useRef } from 'react'
import {
  listenToRoom, startGame, submitResult, endGame, leaveRoom,
  getAverage, getBestRound, sortPlayers
} from '../firebase/roomService'

export default function GameRoom({ code, playerId, isHost, onLeave }) {
  const [room, setRoom]           = useState(null)
  const [localState, setLocalState] = useState('waiting') // waiting | clicked | tooEarly
  const [countdown, setCountdown] = useState(3)
  const [myTime, setMyTime]       = useState(null)

  const clickTimeRef    = useRef(null)
  const countdownRef    = useRef(null)
  const hasClickedRef   = useRef(false)
  const prevRoomState   = useRef(null)

  // Firebase Echtzeit-Listener
  useEffect(() => {
    const unsubscribe = listenToRoom(code, setRoom)
    return () => {
      unsubscribe()
      leaveRoom(code, playerId)
    }
  }, [code, playerId])

  // Countdown starten wenn State auf 'countdown' wechselt
  useEffect(() => {
    if (room?.state !== 'countdown') return
    if (prevRoomState.current === 'countdown') return
    prevRoomState.current = 'countdown'

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

  // Startzeitpunkt merken wenn Feld grün wird
  useEffect(() => {
    if (room?.state === 'ready') {
      prevRoomState.current = 'ready'
      clickTimeRef.current = Date.now()
    }
    if (room?.state === 'results') {
      prevRoomState.current = 'results'
    }
    if (room?.state === 'lobby') {
      prevRoomState.current = 'lobby'
    }
  }, [room?.state])

  function handleClick() {
    if (hasClickedRef.current) return
    hasClickedRef.current = true

    if (room?.state === 'waiting' || room?.state === 'countdown') {
      setLocalState('tooEarly')
      submitResult(code, playerId, null, true, room.currentRound)
      return
    }

    if (room?.state === 'ready') {
      const ms = Date.now() - clickTimeRef.current
      setMyTime(ms)
      setLocalState('clicked')
      submitResult(code, playerId, ms, false, room.currentRound)
    }
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text)] font-mono text-sm animate-pulse">Verbinde …</p>
      </div>
    )
  }

  return <div>...</div>
}

function getRating(ms) {
  if (ms < 200) return '⚡ Blitzschnell!'
  if (ms < 300) return '🎯 Sehr gut!'
  if (ms < 400) return '👍 Gut!'
  if (ms < 500) return '🙂 Okay!'
  return '🐢 Trainiere weiter!'
}