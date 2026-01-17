'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hash, AlertCircle, Loader2 } from 'lucide-react'

interface PinEntryProps {
  onPinSubmit: (pin: string) => Promise<{ success: boolean; error?: string }>
}

export default function PinEntry({ onPinSubmit }: PinEntryProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePinChange = (value: string) => {
    // Only allow digits and max 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setPin(cleaned)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits')
      return
    }

    setLoading(true)
    setError('')

    const result = await onPinSubmit(pin)
    
    if (!result.success) {
      setError(result.error || 'Invalid PIN. Please try again.')
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
          <Hash className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold gradient-text mb-3">Enter Game PIN</h1>
        <p className="text-gray-600 mb-8">
          Get the PIN from your quiz host to join the game
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
              inputMode="numeric"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="w-full text-center text-5xl font-bold tracking-widest input py-6"
              placeholder="000000"
              maxLength={6}
              disabled={loading}
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              {pin.length}/6 digits
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="btn btn-primary w-full text-xl py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Game'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Don't have a PIN? Ask your quiz host to start a game!
          </p>
        </div>
      </div>
    </motion.div>
  )
}
