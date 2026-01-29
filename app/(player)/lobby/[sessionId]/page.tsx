'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader2, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
  joined_at: string
}

interface GameSession {
  id: string
  pin: string
  status: string
  quiz_id: string
  quizzes?: {
    title: string
  }
}

export default function LobbyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const playerId = searchParams.get('playerId')

  const [session, setSession] = useState<GameSession | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    // Fetch initial data
    const fetchData = async () => {
      try {
        // Get session info
        const { data: sessionData } = await supabase
          .from('game_sessions')
          .select('*, quizzes(title)')
          .eq('id', sessionId)
          .single()

        if (sessionData) {
          setSession(sessionData as GameSession)
        }

        // Get players
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_active', true)
          .order('joined_at', { ascending: true })

        if (playersData) {
          setPlayers(playersData)
        }
      } catch (err) {
        console.error('Error loading lobby:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`lobby:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPlayer = payload.new as Player
            setPlayers((prev) => {
              if (prev.some(p => p.id === newPlayer.id)) return prev
              return [...prev, newPlayer]
            })
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newSession = payload.new as GameSession
          setSession(newSession)
          
          // If game started, redirect to play page
          if (newSession.status === 'active') {
            router.push(`/play/${sessionId}?playerId=${playerId}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
    }
  }, [sessionId, playerId, router])

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    try {
      if (!seed || typeof seed !== 'string') return { style: 'fun-emoji', seed: 'default' }

      const parts = seed.split(':')
      if (parts.length < 2) {
        // Fallback for old/malformed seeds
        return { style: 'fun-emoji', seed: seed || 'default' }
      }
      return { style: parts[0] as AvatarStyle, seed: parts[1] }
    } catch (e) {
      console.error('Error parsing avatar seed:', seed, e)
      return { style: 'fun-emoji', seed: 'default' }
    }
  }

  const displayedPlayers = useMemo(() => {
    // Show first 100 players to keep DOM lightweight
    const slice = players.slice(0, 100)

    // Ensure current player is visible even if joined late (and list is full)
    if (playerId) {
      const currentPlayer = players.find(p => p.id === playerId)
      if (currentPlayer && !slice.find(p => p.id === playerId)) {
        // Replace last item with current player or just append?
        // Appending makes it 101 items which is fine.
        slice.push(currentPlayer)
      }
    }

    return slice
  }, [players, playerId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full shadow-glow mb-6">
            <Trophy className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-lg">Game PIN: {session?.pin}</span>
          </div>
          
          <h1 className="text-5xl font-black gradient-text mb-4">
            {session?.quizzes?.title || 'Quiz Lobby'}
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Waiting for host to start the game...
          </p>
          
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Users className="w-5 h-5" />
            <span className="font-semibold">{players.length} player{players.length !== 1 ? 's' : ''} joined</span>
          </div>
          {players.length > 100 && (
            <p className="text-xs text-gray-400 mt-1">
              (Showing first 100 players)
            </p>
          )}
        </motion.div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {displayedPlayers.map((player, index) => {
              const { style, seed } = parseAvatarSeed(player.avatar_seed)
              const avatarUrl = getAvatarUrl(seed, style)
              const isCurrentPlayer = player.id === playerId

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    delay: Math.min(index * 0.05, 1.0), // Cap delay so 100th item doesn't take 5s
                  }}
                  className={`card-hover text-center ${
                    isCurrentPlayer ? 'ring-4 ring-primary-500' : ''
                  }`}
                >
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-2">
                      <div className="w-full h-full rounded-full bg-white overflow-hidden">
                        <Image
                          src={avatarUrl}
                          alt={player.nickname}
                          width={96}
                          height={96}
                          className="w-full h-full"
                          unoptimized
                        />
                      </div>
                    </div>
                    {isCurrentPlayer && (
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">You</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-gray-900 truncate">{player.nickname}</p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Waiting Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
