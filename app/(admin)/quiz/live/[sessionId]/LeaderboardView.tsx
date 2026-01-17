'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { Trophy, Crown, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
}

interface LeaderboardViewProps {
  players: Player[]
  currentQuestionId: string
}

function AnimatedNumber({ from, to }: { from: number; to: number }) {
  const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    spring.set(to)
  }, [spring, to])

  return <motion.span>{display}</motion.span>
}

export default function LeaderboardView({ players, currentQuestionId }: LeaderboardViewProps) {
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPreviousScores = async () => {
      const supabase = createClient()

      // Get answers for this question to calculate delta
      const { data: answers } = await supabase
        .from('player_answers')
        .select('player_id, points_earned')
        .eq('question_id', currentQuestionId)

      const prevScores: Record<string, number> = {}

      // Calculate previous score for each player
      players.forEach(player => {
        const answer = answers?.find((a: any) => a.player_id === player.id)
        const pointsEarned = answer?.points_earned || 0
        prevScores[player.id] = player.score - pointsEarned
      })

      setPreviousScores(prevScores)
      setLoading(false)
    }

    fetchPreviousScores()
  }, [currentQuestionId, players])

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score).slice(0, 10)

  return (
    <div className="card w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-gray-500 mt-2">Top 10 Players</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.map((player, index) => {
            const { style, seed } = parseAvatarSeed(player.avatar_seed)
            const avatarUrl = getAvatarUrl(seed, style)
            const prevScore = previousScores[player.id] ?? player.score
            const isTop3 = index < 3

            return (
              <motion.div
                layout
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                  isTop3
                    ? index === 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : index === 1
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-orange-50 border-orange-200'
                    : 'bg-white border-transparent shadow-sm hover:border-gray-100'
                }`}
              >
                <div className="flex items-center justify-center w-12 font-bold text-2xl">
                  {index === 0 && <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />}
                  {index === 1 && <Medal className="w-8 h-8 text-gray-400 fill-gray-400" />}
                  {index === 2 && <Medal className="w-8 h-8 text-orange-400 fill-orange-400" />}
                  {index > 2 && <span className="text-gray-400">#{index + 1}</span>}
                </div>

                <div className={`w-14 h-14 rounded-full p-1 ${
                  isTop3
                    ? 'bg-gradient-to-br from-yellow-200 to-orange-200'
                    : 'bg-gradient-to-br from-primary-100 to-secondary-100'
                }`}>
                  <div className="w-full h-full rounded-full bg-white overflow-hidden">
                    <Image
                      src={avatarUrl}
                      alt={player.nickname}
                      width={56}
                      height={56}
                      className="w-full h-full"
                      unoptimized
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {player.nickname}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-primary-600 font-mono">
                    <AnimatedNumber from={prevScore} to={player.score} />
                  </div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Points</p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
