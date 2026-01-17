import { useEffect } from 'react'

export function usePlayerPresence(playerId: string | null) {
  useEffect(() => {
    if (!playerId) return

    // Initial heartbeat
    const sendHeartbeat = () => {
      fetch('/api/player/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      }).catch(console.error)
    }

    sendHeartbeat()

    // Regular heartbeat every 10 seconds
    const interval = setInterval(sendHeartbeat, 10000)

    return () => clearInterval(interval)
  }, [playerId])
}
