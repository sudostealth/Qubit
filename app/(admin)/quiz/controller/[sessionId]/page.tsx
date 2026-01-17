'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Play, SkipForward, Trophy, X, Copy, Check, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'
import QRCodeLib from 'qrcode'
import QRCodeModal from '@/components/admin/QRCodeModal'

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
  current_question_index: number
  max_participants: number
  quizzes?: {
    title: string
    questions: any[]
  }
}

export default function GameControllerPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<GameSession | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    const supabase = createClient()

    const fetchData = async () => {
      // Get session with quiz data
      const { data: sessionData } = await supabase
        .from('game_sessions')
        .select('*, quizzes(title, questions(*))')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        setSession(sessionData as any)
        
        // Generate QR code
        const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?pin=${sessionData.pin}`
        try {
          const qrDataUrl = await QRCodeLib.toDataURL(joinUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#4F46E5', // primary-600
              light: '#FFFFFF',
            },
          })
          setQrCodeUrl(qrDataUrl)
        } catch (err) {
          console.error('Error generating QR code:', err)
        }
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

      setLoading(false)
    }

    fetchData()

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`controller:${sessionId}`)
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
            setPlayers((prev) => [...prev, payload.new as Player])
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id))
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
    }
  }, [sessionId])

  const copyPin = () => {
    navigator.clipboard.writeText(session?.pin || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = async () => {
    const supabase = createClient()
    await supabase
      .from('game_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Redirect to live game page
    router.push(`/quiz/live/${sessionId}`)
  }

  const removePlayer = async (playerId: string) => {
    const supabase = createClient()
    await supabase
      .from('players')
      .update({ is_active: false })
      .eq('id', playerId)
  }

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">{session?.quizzes?.title}</h1>
              <p className="text-sm text-gray-600 mt-1">Game Controller</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Game PIN</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-primary-600">{session?.pin}</span>
                  <button
                    onClick={copyPin}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Show QR Code"
                  >
                    <QrCode className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {session?.status === 'waiting' && players.length > 0 && (
                <button
                  onClick={startGame}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Game
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Players Joined</p>
                <p className="text-2xl font-bold text-gray-900">
                  {players.length} / {session?.max_participants}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {session?.quizzes?.questions?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                session?.status === 'waiting' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  session?.status === 'waiting' ? 'bg-yellow-500' : 'bg-green-500'
                } animate-pulse`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {session?.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Players ({players.length})
            </h2>
            {session?.status === 'waiting' && (
              <p className="text-sm text-gray-600">
                Waiting for players to join...
              </p>
            )}
          </div>

          {players.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No players yet</h3>
              <p className="text-gray-600 mb-4">
                Share the PIN <span className="font-bold text-primary-600">{session?.pin}</span> with players to join
              </p>
              <p className="text-sm text-gray-500">
                Players can join at: <span className="font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}/join</span>
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {players.map((player, index) => {
                  const { style, seed } = parseAvatarSeed(player.avatar_seed)
                  const avatarUrl = getAvatarUrl(seed, style)

                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group"
                    >
                      <div className="card-hover">
                        <div className="relative w-20 h-20 mx-auto mb-3">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-2">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden">
                              <Image
                                src={avatarUrl}
                                alt={player.nickname}
                                width={80}
                                height={80}
                                className="w-full h-full"
                                unoptimized
                              />
                            </div>
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-center truncate">
                          {player.nickname}
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          Score: {player.score}
                        </p>
                      </div>

                      {/* Remove button */}
                      {session?.status === 'waiting' && (
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Instructions */}
        {session?.status === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 card bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-3">How to Start</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">1</span>
                <span>Share the PIN <span className="font-bold text-primary-600">{session?.pin}</span> with your players</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">2</span>
                <span>Wait for players to join (they'll appear below)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-sm flex items-center justify-center font-bold">3</span>
                <span>Click "Start Game" when ready</span>
              </li>
            </ol>
          </motion.div>
        )}
      </main>
      
      {/* QR Code Modal */}
      <QRCodeModal
        pin={session?.pin || ''}
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </div>
  )
}
