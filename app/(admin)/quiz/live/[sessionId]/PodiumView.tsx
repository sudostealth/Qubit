'use client'

import { motion } from 'framer-motion'
import { Crown, Medal } from 'lucide-react'
import Image from 'next/image'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
}

interface PodiumViewProps {
  players: Player[]
  onEndGame: () => void
}

export default function PodiumView({ players, onEndGame }: PodiumViewProps) {
  // Get top 3
  const top3 = players.slice(0, 3)
  const rest = players.slice(3)

  // Helper to parse avatar
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

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-gray-900 mb-2">Final Results</h2>
        <p className="text-xl text-gray-600">Congratulations to our winners!</p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-4 mb-12 h-64 md:h-80">
        {podiumOrder.map((player, index) => {
          if (!player) return null

          // Determine rank based on position in array [2nd, 1st, 3rd]
          // If 1st exists (index 1), rank is 1. If 2nd (index 0), rank 2. If 3rd (index 2), rank 3.
          // Wait, simple logic:
          // index 0 -> player=top3[1] -> Rank 2
          // index 1 -> player=top3[0] -> Rank 1
          // index 2 -> player=top3[2] -> Rank 3

          const isFirst = player.id === top3[0]?.id
          const isSecond = player.id === top3[1]?.id
          const isThird = player.id === top3[2]?.id

          const rank = isFirst ? 1 : isSecond ? 2 : 3

          const { style, seed } = parseAvatarSeed(player.avatar_seed)
          const avatarUrl = getAvatarUrl(seed, style)

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.2, type: 'spring' }}
              className={`flex flex-col items-center ${isFirst ? 'z-10 order-2' : isSecond ? 'order-1' : 'order-3'}`}
            >
              {/* Avatar */}
              <div className="mb-4 relative">
                 {isFirst && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2"
                    >
                        <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500 animate-bounce" />
                    </motion.div>
                 )}
                 <div className={`rounded-full p-1 ${
                    isFirst ? 'w-24 h-24 bg-yellow-400' :
                    isSecond ? 'w-20 h-20 bg-gray-300' :
                    'w-16 h-16 bg-orange-400'
                 }`}>
                    <div className="w-full h-full rounded-full bg-white overflow-hidden border-4 border-white">
                        <Image
                          src={avatarUrl}
                          alt={player.nickname}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                    </div>
                 </div>
              </div>

              {/* Bar */}
              <div
                 className={`w-24 md:w-32 rounded-t-lg flex flex-col items-center justify-end pb-4 text-white shadow-lg ${
                    isFirst ? 'h-48 bg-gradient-to-t from-yellow-500 to-yellow-300' :
                    isSecond ? 'h-32 bg-gradient-to-t from-gray-400 to-gray-200' :
                    'h-24 bg-gradient-to-t from-orange-500 to-orange-300'
                 }`}
              >
                 <span className="text-3xl font-black">{rank}</span>
                 <span className="font-bold text-sm opacity-90">{player.score} pts</span>
              </div>

              <p className="mt-2 font-bold text-lg text-gray-800">{player.nickname}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Rest of the List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto">
         {top3.map((p, i) => (
             <div key={p.id} className="flex items-center p-3 border-b border-gray-100 bg-yellow-50/50">
                <span className="w-8 font-bold text-gray-500">#{i+1}</span>
                <span className="flex-1 font-semibold">{p.nickname}</span>
                <span className="font-bold text-gray-900">{p.score}</span>
             </div>
         ))}
         {rest.map((player, index) => (
             <div key={player.id} className="flex items-center p-3 border-b border-gray-100">
                <span className="w-8 font-bold text-gray-500">#{index + 4}</span>
                <span className="flex-1 text-gray-700">{player.nickname}</span>
                <span className="font-medium text-gray-600">{player.score}</span>
             </div>
         ))}
      </div>

      {/* Controls */}
      <div className="mt-8 flex justify-center">
         <button
            onClick={onEndGame}
            className="btn btn-primary px-8 py-3 text-lg shadow-xl hover:scale-105 transition-transform"
         >
            Close Quiz & Reset
         </button>
      </div>
    </div>
  )
}
