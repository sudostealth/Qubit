'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, AlertCircle, Loader2 } from 'lucide-react'

interface NicknameEntryProps {
  onNicknameSubmit: (nickname: string) => Promise<{ success: boolean; error?: string }>
  sessionPin: string
}

export default function NicknameEntry({ onNicknameSubmit, sessionPin }: NicknameEntryProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (nickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters')
      return
    }

    if (nickname.trim().length > 20) {
      setError('Nickname must be less than 20 characters')
      return
    }

    setLoading(true)
    setError('')

    const result = await onNicknameSubmit(nickname.trim())
    
    if (!result.success) {
      setError(result.error || 'This nickname is already taken. Please choose another.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="card text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-6"
        >
          <User className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold gradient-text mb-3">What's your name?</h1>
        <p className="text-gray-600 mb-2">
          Choose a nickname for the game
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Game PIN: <span className="font-bold text-primary-600">{sessionPin}</span>
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full text-center text-3xl font-bold input py-6"
              placeholder="Enter nickname"
              maxLength={20}
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              {nickname.length}/20 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || nickname.trim().length < 2}
            className="btn btn-primary w-full text-xl py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Joining...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your nickname will be visible to other players
          </p>
        </div>
      </div>
    </motion.div>
  )
}
