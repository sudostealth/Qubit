'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Home } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'

interface LeaderboardEntry {
  id: string
  nickname: string
  avatar_seed: string
  score: number
  rank: number
}

export default function ResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessionId = params.sessionId as string
  const playerId = searchParams.get('playerId')

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return

    const fetchResults = async () => {
      const supabase = createClient()

      // Get all players with scores
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('score', { ascending: false })

      if (players) {
        const leaderboardData = players.map((player, index) => ({
          id: player.id,
          nickname: player.nickname,
          avatar_seed: player.avatar_seed,
          score: player.score,
          rank: index + 1,
        }))

        setLeaderboard(leaderboardData)

        // Find current player
        const current = leaderboardData.find(p => p.id === playerId)
        if (current) {
          setCurrentPlayer(current)
        }
      }

      setLoading(false)
    }

    fetchResults()
  }, [sessionId, playerId])

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />
    if (rank === 3) return <Award className="w-8 h-8 text-orange-600" />
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black gradient-text mb-4">Game Over!</h1>
          <p className="text-xl text-gray-600">Final Results</p>
        </motion.div>

        {/* Current Player Score */}
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card mb-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
          >
            <div className="text-center">
              <p className="text-lg mb-2">Your Rank</p>
              <p className="text-6xl font-black mb-4">#{currentPlayer.rank}</p>
              <p className="text-3xl font-bold">{currentPlayer.score} points</p>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h2>

          <div className="space-y-3">
            {leaderboard.map((player, index) => {
              const { style, seed } = parseAvatarSeed(player.avatar_seed)
              const avatarUrl = getAvatarUrl(seed, style)
              const isCurrentPlayer = player.id === playerId

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    isCurrentPlayer
                      ? 'bg-gradient-to-r from-primary-100 to-secondary-100 ring-2 ring-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {player.rank <= 3 ? (
                      getMedalIcon(player.rank)
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">
                        {player.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-1">
                      <div className="w-full h-full rounded-full bg-white overflow-hidden">
                        <Image
                          src={avatarUrl}
                          alt={player.nickname}
                          width={64}
                          height={64}
                          className="w-full h-full"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nickname */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${
                      isCurrentPlayer ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {player.nickname}
                      {isCurrentPlayer && (
                        <span className="ml-2 text-sm font-normal text-primary-600">
                          (You)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-2xl font-bold ${
                      isCurrentPlayer ? 'text-primary-600' : 'text-gray-900'
                    }`}>
                      {player.score.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <Link href="/" className="btn btn-primary inline-flex items-center gap-2">
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </motion.div>

        {/* Confetti for top 3 */}
        {currentPlayer && currentPlayer.rank <= 3 && (
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -20,
                  rotate: 0,
                }}
                animate={{
                  y: window.innerHeight + 20,
                  rotate: 360,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'][
                    Math.floor(Math.random() * 4)
                  ],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
