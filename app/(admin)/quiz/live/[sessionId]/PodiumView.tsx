'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Medal, CheckCircle, XCircle, HelpCircle, AlertCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import { createClient } from '@/lib/supabase/client'

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
}

interface PodiumViewProps {
  players: Player[]
  onEndGame: () => void
  sessionId?: string
  totalQuestions?: number
}

interface PlayerStats {
  correct: number
  wrong: number
  participated: number
  notParticipated: number
}

export default function PodiumView({ players, onEndGame, sessionId, totalQuestions = 0 }: PodiumViewProps) {
  const [stats, setStats] = useState<Record<string, PlayerStats>>({})
  const [loading, setLoading] = useState(true)

  // Get top 3
  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  useEffect(() => {
    const fetchStats = async () => {
      if (!players.length) return

      const supabase = createClient()
      const playerIds = players.map(p => p.id)

      const { data: answers } = await supabase
        .from('player_answers')
        .select('*')
        .in('player_id', playerIds)

      const newStats: Record<string, PlayerStats> = {}

      players.forEach(player => {
        const playerAnswers = answers?.filter((a: any) => a.player_id === player.id) || []
        const correct = playerAnswers.filter((a: any) => a.is_correct).length
        const participated = playerAnswers.length
        // Wrong answers are those that were answered but not correct
        const wrong = participated - correct
        const notParticipated = totalQuestions - participated

        newStats[player.id] = {
          correct,
          wrong,
          participated,
          notParticipated: notParticipated < 0 ? 0 : notParticipated
        }
      })

      setStats(newStats)
      setLoading(false)
    }

    fetchStats()
  }, [players, totalQuestions])

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [
    top3[1], // 2nd
    top3[0], // 1st
    top3[2]  // 3rd
  ].filter(Boolean)

  if (loading) {
    return (
       <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
       </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="w-[800px] h-[800px] bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
        </div>
        <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 mb-4 relative z-10">
           Final Results
        </h2>
        <p className="text-2xl text-gray-600 font-medium relative z-10">The champions have risen!</p>
      </motion.div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 md:gap-8 mb-20 h-80 md:h-96 perspective-1000">
        {podiumOrder.map((player, index) => {
          if (!player) return null

          // Determine rank
          const isFirst = player.id === top3[0]?.id
          const isSecond = player.id === top3[1]?.id
          const isThird = player.id === top3[2]?.id
          const rank = isFirst ? 1 : isSecond ? 2 : 3

          const { style, seed } = parseAvatarSeed(player.avatar_seed)
          const avatarUrl = getAvatarUrl(seed, style)
          const pStats = stats[player.id]

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: rank === 1 ? 0.5 : rank === 2 ? 0.2 : 0.8,
                type: 'spring',
                stiffness: 100,
                damping: 15
              }}
              className={`flex flex-col items-center relative group ${isFirst ? 'z-20 order-2 -mt-12' : isSecond ? 'order-1' : 'order-3'}`}
            >
              {/* Avatar */}
              <div className="mb-6 relative">
                 {isFirst && (
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
                    >
                        <Crown className="w-16 h-16 text-yellow-500 fill-yellow-400 drop-shadow-lg" />
                    </motion.div>
                 )}
                 <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`rounded-full p-2 shadow-2xl ${
                    isFirst ? 'w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-500' :
                    isSecond ? 'w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-500' :
                    'w-24 h-24 bg-gradient-to-br from-orange-300 to-red-500'
                 }`}>
                    <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white">
                        <Image
                          src={avatarUrl}
                          alt={player.nickname}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                    </div>
                 </motion.div>

                 {/* Rank Badge */}
                 <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl text-white shadow-lg border-2 border-white ${
                    isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-500' : 'bg-orange-500'
                 }`}>
                    {rank}
                 </div>
              </div>

              {/* Stats Card (Hover) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-center z-30"
              >
                 <div className="font-bold text-gray-900 mb-1">{player.nickname}</div>
                 <div className="text-2xl font-black text-primary-600 mb-2">{player.score} pts</div>
                 {pStats && (
                     <div className="flex justify-center gap-3 text-xs font-bold text-gray-500">
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3"/> {pStats.correct}</span>
                        <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3 h-3"/> {pStats.wrong}</span>
                     </div>
                 )}
              </motion.div>

              {/* Podium Block */}
              <div
                 className={`w-32 md:w-40 rounded-t-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm ${
                    isFirst ? 'h-64 bg-gradient-to-t from-yellow-500/90 to-yellow-300/80' :
                    isSecond ? 'h-48 bg-gradient-to-t from-gray-400/90 to-gray-200/80' :
                    'h-32 bg-gradient-to-t from-orange-500/90 to-orange-300/80'
                 }`}
              >
                 <div className="absolute inset-0 bg-white/10" />
                 <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Spacer for hovering cards */}
      <div className="h-24"></div>

      {/* Detailed Results List */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl mx-auto"
      >
         <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-500 uppercase tracking-wider text-sm">Full Standings</h3>
            <div className="flex gap-4 text-xs font-bold text-gray-400 uppercase">
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Correct</span>
                <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Wrong</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Skipped</span>
            </div>
         </div>

         <div className="divide-y divide-gray-100">
            {players.map((player, index) => {
                 const pStats = stats[player.id]
                 const isTop3 = index < 3

                 return (
                     <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.5 + (index * 0.05) }}
                        className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${isTop3 ? 'bg-yellow-50/30' : ''}`}
                     >
                        <div className="w-12 text-center font-bold text-gray-400 text-lg">#{index + 1}</div>

                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                <Image
                                  src={getAvatarUrl(parseAvatarSeed(player.avatar_seed).seed, parseAvatarSeed(player.avatar_seed).style)}
                                  alt={player.nickname}
                                  width={40}
                                  height={40}
                                  className="w-full h-full"
                                  unoptimized
                                />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{player.nickname}</div>
                                {isTop3 && <div className="text-xs font-bold text-yellow-600 flex items-center gap-1"><Crown className="w-3 h-3"/> Top 3</div>}
                            </div>
                        </div>

                        <div className="flex items-center gap-8 mr-8">
                             {pStats && (
                                 <>
                                    <div className="flex flex-col items-center w-12">
                                        <span className="font-bold text-lg text-green-600">{pStats.correct}</span>
                                    </div>
                                    <div className="flex flex-col items-center w-12">
                                        <span className="font-bold text-lg text-red-500">{pStats.wrong}</span>
                                    </div>
                                    <div className="flex flex-col items-center w-12">
                                        <span className="font-bold text-lg text-gray-400">{pStats.notParticipated}</span>
                                    </div>
                                 </>
                             )}
                        </div>

                        <div className="w-24 text-right font-black text-2xl text-primary-600 tabular-nums">
                            {player.score}
                        </div>
                     </motion.div>
                 )
            })}
         </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="mt-12 flex justify-center"
      >
         <button
            onClick={onEndGame}
            className="btn btn-primary px-12 py-4 text-xl shadow-2xl shadow-primary-500/30 hover:scale-105 hover:-translate-y-1 transition-all flex items-center gap-3"
         >
            <Sparkles className="w-6 h-6" />
            Clear & Start New Game
         </button>
      </motion.div>
    </div>
  )
}
