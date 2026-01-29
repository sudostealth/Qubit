'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import PinEntry from '@/components/player/PinEntry'
import NicknameEntry from '@/components/player/NicknameEntry'
import AvatarSelector from '@/components/player/AvatarSelector'
import { generateRandomAvatar, type AvatarStyle } from '@/lib/utils/avatar'
import { createClient } from '@/lib/supabase/client'

type JoinStep = 'pin' | 'nickname' | 'avatar'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<JoinStep>('pin')
  const [sessionPin, setSessionPin] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState(generateRandomAvatar())
  const [isJoining, setIsJoining] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handlePinSubmit = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient()
      
      // Check if game session exists and is in waiting or active status
      const { data: session, error } = await supabase
        .from('game_sessions')
        .select('id, status, max_participants, players(count)')
        .eq('pin', pin)
        .single()

      if (error || !session) {
        return { success: false, error: 'Invalid PIN. Please check and try again.' }
      }

      if (session.status === 'finished') {
        return { success: false, error: 'This game has already finished.' }
      }

      // Check if session is full
      const playerCount = session.players?.[0]?.count || 0
      if (playerCount >= session.max_participants) {
        return { success: false, error: 'This game is full. Please try another PIN.' }
      }

      setSessionPin(pin)
      setSessionId(session.id)
      setStep('nickname')
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Unable to connect. Please check your internet connection.' }
    }
  }

  const handleNicknameSubmit = async (nick: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient()
      
      // Check if nickname is already taken in this session using maybeSingle to safely handle 0 results
      const { data: existing, error } = await supabase
        .from('players')
        .select('id')
        .eq('session_id', sessionId)
        .eq('nickname', nick)
        .maybeSingle()

      if (error) {
         console.error('Error checking nickname:', error)
         // In case of error, we default to "allow" but rely on constraint later
      }

      if (existing) {
        return { success: false, error: 'This nickname is already taken. Please choose another.' }
      }

      setNickname(nick)
      setStep('avatar')
      return { success: true }
    } catch (err) {
      console.error('Unexpected error checking nickname:', err)
      // Allow proceeding, backend unique constraint will catch it if it exists
      setNickname(nick)
      setStep('avatar')
      return { success: true }
    }
  }

  const handleAvatarSelect = (seed: string, style: AvatarStyle) => {
    setAvatar({ seed, style, url: '' })
  }

  const handleJoinGame = async () => {
    if (isJoining) return
    setIsJoining(true)
    setErrorMsg('')

    // Set timeout to reset state if taking too long (e.g. navigation hang)
    const timeoutId = setTimeout(() => {
      setIsJoining(false)
      setErrorMsg('Joining took too long. Please try again.')
    }, 15000)

    try {
      const supabase = createClient()
      
      // Ensure avatar data is valid
      const avatarSeed = (avatar.style && avatar.seed)
        ? `${avatar.style}:${avatar.seed}`
        : `fun-emoji:${Math.random().toString(36).substring(7)}`

      // Create player record
      const { data: player, error } = await supabase
        .from('players')
        .insert({
          session_id: sessionId,
          nickname,
          avatar_seed: avatarSeed,
          score: 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating player:', error)
        clearTimeout(timeoutId)
        setIsJoining(false)

        // Handle Unique Violation (Duplicate Nickname)
        if (error.code === '23505') {
            setErrorMsg(`Nickname '${nickname}' is already taken. Please go back and choose another.`)
        } else {
            setErrorMsg('Failed to join game. Please try again.')
        }
        return
      }

      // Redirect to lobby
      router.push(`/lobby/${sessionId}?playerId=${player.id}`)

    } catch (err) {
      console.error('Error joining game:', err)
      clearTimeout(timeoutId)
      setIsJoining(false)
      setErrorMsg('An unexpected error occurred.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Back button */}
      {step !== 'pin' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 left-8"
        >
          <button
            onClick={() => {
              if (step === 'nickname') setStep('pin')
              else if (step === 'avatar') setStep('nickname')
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </motion.div>
      )}

      {/* Home link */}
      <Link
        href="/"
        className="absolute top-8 right-8 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Home
      </Link>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <PinEntry onPinSubmit={handlePinSubmit} />
          </motion.div>
        )}

        {step === 'nickname' && (
          <motion.div
            key="nickname"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <NicknameEntry onNicknameSubmit={handleNicknameSubmit} sessionPin={sessionPin} />
          </motion.div>
        )}

        {step === 'avatar' && (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <AvatarSelector
              onAvatarSelect={handleAvatarSelect}
              initialSeed={avatar.seed}
              initialStyle={avatar.style}
            />

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <button
              onClick={handleJoinGame}
              disabled={isJoining}
              className="btn btn-primary w-full max-w-md text-xl py-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Lobby'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      <div className="absolute bottom-8 flex gap-2">
        {['pin', 'nickname', 'avatar'].map((s, index) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-all ${
              step === s
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 w-8'
                : index < ['pin', 'nickname', 'avatar'].indexOf(step)
                ? 'bg-primary-300'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
