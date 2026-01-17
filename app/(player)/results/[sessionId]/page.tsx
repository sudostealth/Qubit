'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Home, CheckCircle, XCircle } from 'lucide-react'
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
  correct_count: number
  wrong_count: number
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

      // Get all players with scores and answers
      const { data: players } = await supabase
        .from('players')
        .select('*, player_answers(is_correct)')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('score', { ascending: false })

      if (players) {
        const leaderboardData = players.map((player, index) => {
          const correct = player.player_answers?.filter((a: any) => a.is_correct).length || 0
          const total = player.player_answers?.length || 0

          return {
            id: player.id,
            nickname: player.nickname,
            avatar_seed: player.avatar_seed,
            score: player.score,
            rank: index + 1,
            correct_count: correct,
            wrong_count: total - correct,
          }
        })

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

        {/* Podium */}
        {leaderboard.length >= 3 && (
          <div className="flex justify-center items-end gap-4 mb-12 h-64">
             {/* 2nd Place */}
             <motion.div
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="flex flex-col items-center"
             >
                <div className="relative">
                  <Medal className="w-8 h-8 text-gray-400 absolute -top-10 left-1/2 -translate-x-1/2" />
                  <div className="w-20 h-20 rounded-full border-4 border-gray-400 overflow-hidden bg-white z-10 relative">
                     <Image src={getAvatarUrl(parseAvatarSeed(leaderboard[1].avatar_seed).seed, parseAvatarSeed(leaderboard[1].avatar_seed).style)} width={80} height={80} alt={leaderboard[1].nickname} className="w-full h-full" unoptimized />
                  </div>
                </div>
                <div className="h-32 w-24 bg-gray-200 rounded-t-lg flex items-center justify-center mt-4">
                   <span className="text-4xl font-bold text-gray-400">2</span>
                </div>
                <p className="font-bold mt-2 text-center w-24 truncate">{leaderboard[1].nickname}</p>
                <p className="text-sm text-gray-500">{leaderboard[1].score} pts</p>
             </motion.div>

             {/* 1st Place */}
             <motion.div
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.7 }}
               className="flex flex-col items-center z-10"
             >
                <div className="relative">
                  <Trophy className="w-12 h-12 text-yellow-500 absolute -top-14 left-1/2 -translate-x-1/2" />
                  <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden bg-white z-10 relative shadow-xl">
                     <Image src={getAvatarUrl(parseAvatarSeed(leaderboard[0].avatar_seed).seed, parseAvatarSeed(leaderboard[0].avatar_seed).style)} width={96} height={96} alt={leaderboard[0].nickname} className="w-full h-full" unoptimized />
                  </div>
                </div>
                <div className="h-40 w-28 bg-yellow-100 rounded-t-lg flex items-center justify-center mt-4 border-t-4 border-yellow-400">
                   <span className="text-6xl font-black text-yellow-600">1</span>
                </div>
                <p className="font-bold mt-2 text-center w-28 truncate">{leaderboard[0].nickname}</p>
                <p className="text-sm text-gray-500">{leaderboard[0].score} pts</p>
             </motion.div>

             {/* 3rd Place */}
             <motion.div
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.9 }}
               className="flex flex-col items-center"
             >
                <div className="relative">
                  <Award className="w-8 h-8 text-orange-600 absolute -top-10 left-1/2 -translate-x-1/2" />
                  <div className="w-20 h-20 rounded-full border-4 border-orange-600 overflow-hidden bg-white z-10 relative">
                     <Image src={getAvatarUrl(parseAvatarSeed(leaderboard[2].avatar_seed).seed, parseAvatarSeed(leaderboard[2].avatar_seed).style)} width={80} height={80} alt={leaderboard[2].nickname} className="w-full h-full" unoptimized />
                  </div>
                </div>
                <div className="h-24 w-24 bg-orange-100 rounded-t-lg flex items-center justify-center mt-4">
                   <span className="text-4xl font-bold text-orange-600">3</span>
                </div>
                <p className="font-bold mt-2 text-center w-24 truncate">{leaderboard[2].nickname}</p>
                <p className="text-sm text-gray-500">{leaderboard[2].score} pts</p>
             </motion.div>
          </div>
        )}

        {/* Current Player Stats */}
        {currentPlayer && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="card mb-8 bg-white border-2 border-primary-100"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rank</p>
                <p className="text-3xl font-black text-primary-600">#{currentPlayer.rank}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Score</p>
                <p className="text-3xl font-black text-primary-600">{currentPlayer.score}</p>
              </div>
              <div>
                 <p className="text-sm text-gray-500 mb-1">Accuracy</p>
                 <div className="flex items-center justify-center gap-2">
                    <span className="flex items-center text-green-600 font-bold">
                       <CheckCircle className="w-4 h-4 mr-1" /> {currentPlayer.correct_count}
                    </span>
                    <span className="flex items-center text-red-500 font-bold">
                       <XCircle className="w-4 h-4 mr-1" /> {currentPlayer.wrong_count}
                    </span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            All Participants
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
                      ? 'bg-primary-50 ring-2 ring-primary-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="w-8 font-bold text-gray-400">#{player.rank}</span>

                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden border border-gray-200">
                    <Image
                      src={avatarUrl}
                      alt={player.nickname}
                      width={40}
                      height={40}
                      className="w-full h-full"
                      unoptimized
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${
                      isCurrentPlayer ? 'text-primary-900' : 'text-gray-900'
                    }`}>
                      {player.nickname}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {player.correct_count}</span>
                        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> {player.wrong_count}</span>
                    </div>
                  </div>

                  <div className="text-right font-bold text-gray-900">
                    {player.score}
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
