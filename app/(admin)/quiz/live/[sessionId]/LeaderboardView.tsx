'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { Trophy, Crown, Medal, Flame, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'
import PodiumView from './PodiumView'

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
}

interface LeaderboardViewProps {
  players: Player[]
  currentQuestionId: string
  isFinal?: boolean
  onEndGame?: () => void
  sessionId?: string
  totalQuestions?: number
}

function AnimatedNumber({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
  const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) => Math.round(current))

  useEffect(() => {
    // Wait for delay before starting animation
    const timeout = setTimeout(() => {
      spring.set(to)
    }, delay * 1000)
    return () => clearTimeout(timeout)
  }, [spring, to, delay])

  return <motion.span>{display}</motion.span>
}

export default function LeaderboardView({
  players,
  currentQuestionId,
  isFinal,
  onEndGame,
  sessionId,
  totalQuestions
}: LeaderboardViewProps) {
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'INIT' | 'ANIMATING' | 'SORTED' | 'PODIUM'>('INIT')
  const [risingStarId, setRisingStarId] = useState<string | null>(null)
  const [fastestId, setFastestId] = useState<string | null>(null)

  // Track if we have already started animation for this question
  const animatedQuestionRef = useRef<string | null>(null)

  // 1. Data Calculation Effect (Runs when players/question updates)
  useEffect(() => {
    const calculateStats = async () => {
      const supabase = createClient()

      // Get answers for this question to calculate delta and find fast/rising
      const { data: answers } = await supabase
        .from('player_answers')
        .select('player_id, points_earned, time_taken, is_correct')
        .eq('question_id', currentQuestionId)

      const prevScores: Record<string, number> = {}

      // Calculate Previous Scores
      players.forEach(player => {
        const answer = answers?.find((a: any) => a.player_id === player.id)
        const pointsEarned = answer?.points_earned || 0
        prevScores[player.id] = player.score - pointsEarned
      })

      // Determine Fastest Performer
      const correctAnswers = answers?.filter((a: any) => a.is_correct && a.time_taken !== null) || []
      if (correctAnswers.length > 0) {
        correctAnswers.sort((a: any, b: any) => a.time_taken - b.time_taken)
        setFastestId(correctAnswers[0].player_id)
      } else {
        setFastestId(null)
      }

      // Determine Rising Star
      const prevSorted = [...players].sort((a, b) => prevScores[b.id] - prevScores[a.id])
      const currSorted = [...players].sort((a, b) => b.score - a.score)

      let maxJump = 0
      let starId = null

      currSorted.forEach((player, currentRank) => {
        const prevRank = prevSorted.findIndex(p => p.id === player.id)
        if (prevRank !== -1) {
           const jump = prevRank - currentRank
           if (jump > maxJump) {
              maxJump = jump
              starId = player.id
           }
        }
      })
      setRisingStarId(starId)
      setPreviousScores(prevScores)
      setLoading(false)
    }

    calculateStats()
  }, [currentQuestionId, players])

  // 2. Animation Sequence Effect (Runs ONLY when question changes or mount)
  useEffect(() => {
    // If we have already animated this question, do not restart sequence
    if (animatedQuestionRef.current === currentQuestionId) {
      return
    }

    // Mark as animating
    animatedQuestionRef.current = currentQuestionId

    // Reset phase (just in case)
    setPhase('INIT')

    const timers: NodeJS.Timeout[] = []

    // Phase 2: Animate numbers
    timers.push(setTimeout(() => setPhase('ANIMATING'), 500))

    // Phase 3: Re-sort list
    timers.push(setTimeout(() => setPhase('SORTED'), 3000))

    // Phase 4: Podium (if final)
    if (isFinal) {
      timers.push(setTimeout(() => setPhase('PODIUM'), 6000))
    }

    return () => {
      timers.forEach(clearTimeout)
    }
  }, [currentQuestionId, isFinal])

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  // Display Logic based on Phase
  const displayedPlayers = useMemo(() => {
    if (phase === 'INIT' || phase === 'ANIMATING') {
        // Sort by previous score
        return [...players].sort((a, b) => (previousScores[b.id] ?? 0) - (previousScores[a.id] ?? 0))
    }
    // Phase SORTED or PODIUM -> Sort by current score
    return [...players].sort((a, b) => b.score - a.score)
  }, [players, previousScores, phase])

  if (loading) {
    return (
      <div className="card flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show Podium View if final and phase reached
  if (isFinal && phase === 'PODIUM' && onEndGame) {
     return (
       <PodiumView
         players={players}
         onEndGame={onEndGame}
         sessionId={sessionId}
         totalQuestions={totalQuestions}
       />
     )
  }

  return (
    <div className="card w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h2>
        <p className="text-gray-500 mt-2">Top Players</p>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayedPlayers.slice(0, 10).map((player, index) => {
            const { style, seed } = parseAvatarSeed(player.avatar_seed)
            const avatarUrl = getAvatarUrl(seed, style)

            // Score handling
            const prevScore = previousScores[player.id] ?? 0
            const currentScore = player.score

            const isTop3 = index < 3
            const isRising = player.id === risingStarId
            const isFastest = player.id === fastestId

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
                className={`relative flex items-center gap-4 p-4 rounded-xl border-2 overflow-hidden ${
                  isTop3
                    ? index === 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : index === 1
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-orange-50 border-orange-200'
                    : 'bg-white border-transparent shadow-sm hover:border-gray-100'
                }`}
              >
                {/* Badges Background */}
                {isRising && (
                   <div className="absolute right-0 top-0 p-1 opacity-10">
                      <Flame className="w-24 h-24 text-red-500" />
                   </div>
                )}

                <div className="flex items-center justify-center w-12 font-bold text-2xl z-10">
                  {index === 0 && <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />}
                  {index === 1 && <Medal className="w-8 h-8 text-gray-400 fill-gray-400" />}
                  {index === 2 && <Medal className="w-8 h-8 text-orange-400 fill-orange-400" />}
                  {index > 2 && <span className="text-gray-400">#{index + 1}</span>}
                </div>

                <div className={`w-14 h-14 rounded-full p-1 z-10 ${
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

                <div className="flex-1 z-10">
                  <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-lg ${isTop3 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {player.nickname}
                      </h3>
                      {isRising && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold border border-red-200">
                             <Flame className="w-3 h-3" /> Rising Star
                          </span>
                      )}
                      {isFastest && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold border border-blue-200">
                             <Zap className="w-3 h-3" /> Fastest
                          </span>
                      )}
                  </div>
                </div>

                <div className="text-right z-10">
                  <div className="text-2xl font-black text-primary-600 font-mono">
                    <AnimatedNumber
                        from={prevScore}
                        to={phase === 'INIT' ? prevScore : currentScore}
                        delay={0.5}
                    />
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
