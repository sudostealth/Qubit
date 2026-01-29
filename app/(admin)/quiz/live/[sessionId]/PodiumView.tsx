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
        <h2 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 mb-4 relative z-10 drop-shadow-sm tracking-tighter">
           CHAMPIONS
        </h2>
        <p className="text-3xl text-gray-700 font-bold relative z-10 tracking-wide uppercase">The Final Results</p>
      </motion.div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 md:gap-12 mb-32 h-96 md:h-[500px] perspective-1000 px-4">
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
              initial={{ opacity: 0, y: 200, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: rank === 1 ? 0.8 : rank === 2 ? 0.2 : 1.4,
                type: 'spring',
                stiffness: 120,
                damping: 12,
                mass: 1.2
              }}
              className={`flex flex-col items-center relative group ${isFirst ? 'z-20 order-2 -mt-16' : isSecond ? 'order-1' : 'order-3'}`}
            >
              {/* Avatar & Name */}
              <div className="mb-8 relative flex flex-col items-center">
                 {isFirst && (
                    <motion.div
                        initial={{ scale: 0, rotate: -45, y: 50 }}
                        animate={{ scale: 1, rotate: 0, y: 0 }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                        className="absolute -top-24 z-20"
                    >
                        <Crown className="w-24 h-24 text-yellow-400 fill-yellow-300 drop-shadow-2xl filter" style={{filter: 'drop-shadow(0 10px 10px rgba(234, 179, 8, 0.5))'}} />
                    </motion.div>
                 )}
                 <motion.div
                    whileHover={{ scale: 1.05, rotate: isFirst ? 2 : -2 }}
                    className={`rounded-full p-2 shadow-2xl relative z-10 ${
                    isFirst ? 'w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 ring-4 ring-yellow-200' :
                    isSecond ? 'w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200' :
                    'w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-orange-300 to-red-500 ring-4 ring-orange-200'
                 }`}>
                    <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white relative">
                        <Image
                          src={avatarUrl}
                          alt={player.nickname}
                          width={224}
                          height={224}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                    </div>
                    {/* Rank Badge */}
                    <div className={`absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-2xl md:text-3xl text-white shadow-xl border-4 border-white ${
                        isFirst ? 'bg-yellow-500' : isSecond ? 'bg-gray-500' : 'bg-orange-500'
                    }`}>
                        {rank}
                    </div>
                 </motion.div>

                 {/* Player Name - Floating above/below */}
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: rank === 1 ? 1.2 : rank === 2 ? 0.6 : 1.8 }}
                    className={`mt-6 md:mt-8 text-center bg-white/90 backdrop-blur-md px-6 py-2 rounded-2xl shadow-xl border-2 border-white/50 min-w-[160px] md:min-w-[200px] transform transition-transform hover:scale-110 duration-300`}
                 >
                    <div className={`font-black text-xl md:text-3xl truncate ${isFirst ? 'text-yellow-600' : isSecond ? 'text-gray-600' : 'text-orange-600'}`}>
                        {player.nickname}
                    </div>
                    <div className="text-lg md:text-xl font-bold text-gray-500">{player.score} pts</div>
                 </motion.div>
              </div>

              {/* Podium Block */}
              <div
                 className={`w-32 md:w-48 rounded-t-3xl shadow-2xl relative overflow-hidden backdrop-blur-sm border-t border-white/30 ${
                    isFirst ? 'h-80 bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-600' :
                    isSecond ? 'h-64 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600' :
                    'h-48 bg-gradient-to-b from-orange-300 via-orange-400 to-red-600'
                 }`}
              >
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                 {/* Shine effect */}
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite]" />

                 {/* Stats embedded in podium for cleaner look */}
                 {pStats && (
                    <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 text-white/90 text-sm font-bold">
                        <div className="flex flex-col items-center">
                            <CheckCircle className="w-5 h-5 drop-shadow-md" />
                            <span>{pStats.correct}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <XCircle className="w-5 h-5 drop-shadow-md" />
                            <span>{pStats.wrong}</span>
                        </div>
                    </div>
                 )}
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
