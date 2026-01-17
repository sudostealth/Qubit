'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check } from 'lucide-react'
import { getAvatarUrl, generateAvatarSeed, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'

interface AvatarSelectorProps {
  onAvatarSelect: (seed: string, style: AvatarStyle) => void
  initialSeed?: string
  initialStyle?: AvatarStyle
}

const avatarStyles: { value: AvatarStyle; label: string }[] = [
  { value: 'fun-emoji', label: 'Fun Emoji' },
  { value: 'avataaars', label: 'Avataaars' },
  { value: 'bottts', label: 'Robots' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'pixel-art', label: 'Pixel Art' },
]

export default function AvatarSelector({ 
  onAvatarSelect, 
  initialSeed, 
  initialStyle = 'fun-emoji' 
}: AvatarSelectorProps) {
  const [seed, setSeed] = useState(initialSeed || generateAvatarSeed())
  const [style, setStyle] = useState<AvatarStyle>(initialStyle)
  const [selectedSeed, setSelectedSeed] = useState(seed)
  const [selectedStyle, setSelectedStyle] = useState(style)

  const handleRandomize = () => {
    const newSeed = generateAvatarSeed()
    setSeed(newSeed)
    setSelectedSeed(newSeed)
    onAvatarSelect(newSeed, selectedStyle)
  }

  const handleStyleChange = (newStyle: AvatarStyle) => {
    setStyle(newStyle)
    setSelectedStyle(newStyle)
    onAvatarSelect(selectedSeed, newStyle)
  }

  const avatarUrl = getAvatarUrl(seed, style)

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center"
      >
        <h2 className="text-2xl font-bold gradient-text mb-6">Choose Your Avatar</h2>

        {/* Avatar Display */}
        <motion.div
          key={seed + style}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative mx-auto w-48 h-48 mb-6"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-4 shadow-lg">
            <div className="w-full h-full rounded-full bg-white overflow-hidden">
              <Image
                src={avatarUrl}
                alt="Your avatar"
                width={192}
                height={192}
                className="w-full h-full"
                unoptimized
              />
            </div>
          </div>
          
          {/* Checkmark indicator */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
          >
            <Check className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>

        {/* Randomize Button */}
        <button
          onClick={handleRandomize}
          className="btn btn-secondary mb-6 flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Randomize
        </button>

        {/* Style Selector */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Avatar Style</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {avatarStyles.map((avatarStyle) => (
              <button
                key={avatarStyle.value}
                onClick={() => handleStyleChange(avatarStyle.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  style === avatarStyle.value
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {avatarStyle.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Click "Randomize" to get a new avatar or choose a different style
          </p>
        </div>
      </motion.div>
    </div>
  )
}
