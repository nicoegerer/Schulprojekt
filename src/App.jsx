import { useState } from 'react'
import LobbyScreen from './components/LobbyScreen'
import GameRoom from './components/GameRoom'

// roomInfo: { code, playerId, playerName, isHost } | null
export default function App() {
  const [roomInfo, setRoomInfo] = useState(null)

  if (!roomInfo) {
    return <LobbyScreen onJoined={setRoomInfo} />
  }

  return (
    <GameRoom
      code={roomInfo.code}
      playerId={roomInfo.playerId}
      playerName={roomInfo.playerName}
      isHost={roomInfo.isHost}
      onLeave={() => setRoomInfo(null)}
    />
  )
}
