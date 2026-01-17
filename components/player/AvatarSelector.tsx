'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check, Zap, Bot, Smile, Hexagon } from 'lucide-react'
import {
  getAvatarUrl,
  generateAvatarSeed,
  type AvatarStyle,
  type AvatarCategory,
  getStylesForCategory,
  HERO_AVATARS
} from '@/lib/utils/avatar'
import Image from 'next/image'

interface AvatarSelectorProps {
  onAvatarSelect: (seed: string, style: AvatarStyle) => void
  initialSeed?: string
  initialStyle?: AvatarStyle
}

const CATEGORIES: { id: AvatarCategory; label: string; icon: any }[] = [
  { id: 'classic', label: 'Classic', icon: Smile },
  { id: 'robot', label: 'Robots', icon: Bot },
  { id: 'creature', label: 'Creatures', icon: Hexagon },
  { id: 'hero', label: 'Heroes', icon: Zap },
]

export default function AvatarSelector({ 
  onAvatarSelect, 
  initialSeed, 
  initialStyle = 'fun-emoji' 
}: AvatarSelectorProps) {
  const [seed, setSeed] = useState(initialSeed || generateAvatarSeed())
  const [style, setStyle] = useState<AvatarStyle>(initialStyle)
  const [category, setCategory] = useState<AvatarCategory>('classic')

  const handleRandomize = () => {
    const newSeed = generateAvatarSeed()
    setSeed(newSeed)
    onAvatarSelect(newSeed, style)
  }

  const handleStyleChange = (newStyle: AvatarStyle) => {
    setStyle(newStyle)
    onAvatarSelect(seed, newStyle)
  }

  const handleCategoryChange = (newCategory: AvatarCategory) => {
    setCategory(newCategory)
    // Automatically switch to the first style in the new category
    const defaultStyle = getStylesForCategory(newCategory)[0]
    setStyle(defaultStyle)
    onAvatarSelect(seed, defaultStyle)
  }

  const handleHeroSelect = (heroSeed: string) => {
    setSeed(heroSeed)
    // Hero category always uses 'adventurer' for now
    setStyle('adventurer')
    onAvatarSelect(heroSeed, 'adventurer')
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

        {/* Category Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                category === cat.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

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

        {/* Controls based on Category */}
        <div className="space-y-4">
          {category === 'hero' ? (
             // Hero Grid Selection
             <div className="grid grid-cols-5 gap-2">
                {HERO_AVATARS.map((hero) => (
                  <button
                    key={hero.id}
                    onClick={() => handleHeroSelect(hero.seed)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      seed === hero.seed ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={hero.label}
                  >
                    <Image
                      src={getAvatarUrl(hero.seed, hero.style as AvatarStyle)}
                      width={64}
                      height={64}
                      alt={hero.label}
                      unoptimized
                    />
                  </button>
                ))}
             </div>
          ) : (
            <>
              {/* Randomize Button */}
              <button
                onClick={handleRandomize}
                className="btn btn-secondary flex items-center justify-center gap-2 mx-auto w-full"
              >
                <RefreshCw className="w-5 h-5" />
                Randomize {CATEGORIES.find(c => c.id === category)?.label}
              </button>

              {/* Sub-styles if multiple exist */}
              {getStylesForCategory(category).length > 1 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {getStylesForCategory(category).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStyleChange(s)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg border-2 transition-all capitalize ${
                          style === s
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {s.replace('-', ' ')}
                      </button>
                   ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {category === 'hero'
              ? 'Select a character from the list above'
              : 'Click "Randomize" to generate a unique avatar'
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}
