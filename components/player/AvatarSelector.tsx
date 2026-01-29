'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check, Zap, Bot, Smile, Hexagon, User, Sliders, Palette, Shirt, Glasses } from 'lucide-react'
import {
  getAvatarUrl,
  generateAvatarSeed,
  type AvatarStyle,
  type AvatarCategory,
  type Gender,
  getStylesForCategory,
  HERO_AVATARS,
  AVATAR_CONFIG,
  GENDER_FILTERS
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

type EditorTab = 'head' | 'face' | 'clothes' | 'access'

export default function AvatarSelector({ 
  onAvatarSelect, 
  initialSeed, 
  initialStyle = 'avataaars'
}: AvatarSelectorProps) {
  // Parsing initial seed to extract custom options if any
  const parsed = useMemo(() => {
    const raw = initialSeed || generateAvatarSeed()
    if (raw.includes('&')) {
      const [base, ...rest] = raw.split('&')
      const options: Record<string, string> = {}
      rest.forEach(p => {
        const [k, v] = p.split('=')
        if (k && v) options[k] = v
      })
      return { base, options }
    }
    return { base: raw, options: {} }
  }, [initialSeed])

  const [seed, setSeed] = useState(parsed.base)
  const [style, setStyle] = useState<AvatarStyle>(initialStyle)
  const [category, setCategory] = useState<AvatarCategory>('classic')
  const [gender, setGender] = useState<Gender>('neutral')
  const [customOptions, setCustomOptions] = useState<Record<string, string>>(parsed.options)
  const [editorTab, setEditorTab] = useState<EditorTab>('head')
  const [isEditing, setIsEditing] = useState(false)

  // Determine effective style options based on gender
  const availableOptions = useMemo(() => {
    if (style !== 'avataaars') return AVATAR_CONFIG

    // Clone config and cast to generic string arrays to allow overrides
    const opts = { ...AVATAR_CONFIG } as Record<string, readonly string[]>

    // Apply gender filters
    if (gender === 'male') {
      opts.top = GENDER_FILTERS.male.top
    } else if (gender === 'female') {
      opts.top = GENDER_FILTERS.female.top
      opts.facialHair = GENDER_FILTERS.female.facialHair
    }

    return opts
  }, [gender, style])

  // Effect to construct full seed string and notify parent
  useEffect(() => {
    let finalSeed = seed

    // Append options if any and style supports it
    if (style === 'avataaars' && Object.keys(customOptions).length > 0) {
      const params = Object.entries(customOptions)
        .map(([k, v]) => `${k}=${v}`)
        .join('&')
      finalSeed = `${seed}&${params}`
    }

    onAvatarSelect(finalSeed, style)
  }, [seed, style, customOptions, onAvatarSelect])

  const handleRandomize = () => {
    const newSeed = generateAvatarSeed()
    setSeed(newSeed)

    // If customizing, randomize specific attributes too
    if (style === 'avataaars') {
       const randomOpts: Record<string, string> = {}

       // Randomize Top based on gender
       const tops = availableOptions.top
       randomOpts.top = tops[Math.floor(Math.random() * tops.length)]

       // Randomize other visible traits
       randomOpts.clothing = AVATAR_CONFIG.clothing[Math.floor(Math.random() * AVATAR_CONFIG.clothing.length)]
       randomOpts.hairColor = AVATAR_CONFIG.hairColor[Math.floor(Math.random() * AVATAR_CONFIG.hairColor.length)]
       randomOpts.skinColor = AVATAR_CONFIG.skinColor[Math.floor(Math.random() * AVATAR_CONFIG.skinColor.length)]

       setCustomOptions(randomOpts)
    } else {
       setCustomOptions({})
    }
  }

  const handleCategoryChange = (newCategory: AvatarCategory) => {
    setCategory(newCategory)

    // Logic to pick best style for category
    if (newCategory === 'classic') {
       setStyle('avataaars') // Default to customizable one
    } else {
       const defaultStyle = getStylesForCategory(newCategory)[0]
       setStyle(defaultStyle)
    }

    // Reset options when switching categories
    setCustomOptions({})
    setIsEditing(false)
  }

  const updateOption = (key: string, value: string) => {
    setCustomOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const avatarUrl = getAvatarUrl(seed + (Object.keys(customOptions).length ? '&' + Object.entries(customOptions).map(([k, v]) => `${k}=${v}`).join('&') : ''), style)

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold gradient-text">Create Avatar</h2>

           {/* Gender Toggle */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['male', 'female', 'neutral'] as const).map((g) => (
                 <button
                    key={g}
                    onClick={() => { setGender(g); handleRandomize(); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                       gender === g ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                 >
                    {g}
                 </button>
              ))}
           </div>
        </div>

        {/* Main Preview */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

           {/* Left: Avatar & Main Controls */}
           <div className="flex-1 w-full flex flex-col items-center">
              <motion.div
                key={avatarUrl}
                initial={{ scale: 0.9, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-48 h-48 mb-6"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-4 shadow-lg border-4 border-white">
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
              </motion.div>

              <div className="w-full grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={handleRandomize}
                    className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Shuffle
                  </button>
                  {style === 'avataaars' && (
                     <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn flex items-center justify-center gap-2 text-sm border-2 ${isEditing ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200'}`}
                     >
                        <Sliders className="w-4 h-4" />
                        Customize
                     </button>
                  )}
              </div>
           </div>

           {/* Right: Options / Categories */}
           <div className="flex-1 w-full">
              {!isEditing ? (
                 // Category Selection Mode
                 <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Select Style</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all ${
                            category === cat.id
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-100 hover:border-gray-200 text-gray-600'
                          }`}
                        >
                          <cat.icon className="w-6 h-6" />
                          <span className="font-bold text-sm">{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {category === 'hero' && (
                       <div className="grid grid-cols-5 gap-2 mt-4">
                          {HERO_AVATARS.map((hero) => (
                            <button
                                key={hero.id}
                                onClick={() => { setSeed(hero.seed); setStyle('adventurer'); }}
                                className={`rounded-lg overflow-hidden border-2 transition-all ${seed === hero.seed ? 'border-primary-500' : 'border-transparent'}`}
                            >
                                <Image src={getAvatarUrl(hero.seed, 'adventurer')} width={40} height={40} alt={hero.label} unoptimized />
                            </button>
                          ))}
                       </div>
                    )}
                 </div>
              ) : (
                 // Editing Mode (Avataaars only)
                 <div className="h-full flex flex-col">
                    <div className="flex border-b border-gray-200 mb-4">
                       {[
                         { id: 'head', icon: User, label: 'Head' },
                         { id: 'face', icon: Smile, label: 'Face' },
                         { id: 'clothes', icon: Shirt, label: 'Outfit' },
                         { id: 'access', icon: Glasses, label: 'Extras' }
                       ].map((tab) => (
                          <button
                             key={tab.id}
                             onClick={() => setEditorTab(tab.id as EditorTab)}
                             className={`flex-1 flex flex-col items-center py-2 text-xs font-bold border-b-2 transition-colors ${
                                editorTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-400'
                             }`}
                          >
                             <tab.icon className="w-4 h-4 mb-1" />
                             {tab.label}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-4">
                       {/* HEAD TAB */}
                       {editorTab === 'head' && (
                          <>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Hair Style</label>
                                <div className="grid grid-cols-3 gap-2">
                                   {availableOptions.top.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('top', opt)}
                                         className={`p-1 rounded border-2 text-[10px] font-bold truncate ${customOptions.top === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                      >
                                         {opt.replace(/([A-Z])/g, ' $1').trim()}
                                      </button>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Hair Color</label>
                                <div className="flex flex-wrap gap-2">
                                   {availableOptions.hairColor.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('hairColor', opt)}
                                         className={`w-6 h-6 rounded-full border-2 ${customOptions.hairColor === opt ? 'ring-2 ring-primary-500 ring-offset-2' : 'border-gray-200'}`}
                                         style={{ backgroundColor: opt === 'platinum' ? '#e5e4e2' : opt === 'silverGray' ? '#c0c0c0' : opt === 'pastelPink' ? '#ffd1dc' : opt.toLowerCase().includes('dark') ? '#333' : opt }}
                                         title={opt}
                                      />
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Skin Tone</label>
                                <div className="flex flex-wrap gap-2">
                                   {availableOptions.skinColor.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('skinColor', opt)}
                                         className={`w-6 h-6 rounded-full border-2 ${customOptions.skinColor === opt ? 'ring-2 ring-primary-500 ring-offset-2' : 'border-gray-200'}`}
                                         style={{ backgroundColor: opt === 'pale' ? '#ffdbac' : opt === 'tanned' ? '#fd9841' : opt === 'brown' ? '#8d5524' : opt === 'black' ? '#222' : '#f1c27d' }}
                                         title={opt}
                                      />
                                   ))}
                                </div>
                             </div>
                          </>
                       )}

                       {/* FACE TAB */}
                       {editorTab === 'face' && (
                          <>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Eyes</label>
                                <div className="grid grid-cols-3 gap-2">
                                   {availableOptions.eyes.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('eyes', opt)}
                                         className={`p-1 rounded border-2 text-[10px] font-bold truncate ${customOptions.eyes === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                      >
                                         {opt}
                                      </button>
                                   ))}
                                </div>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Mouth</label>
                                <div className="grid grid-cols-3 gap-2">
                                   {availableOptions.mouth.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('mouth', opt)}
                                         className={`p-1 rounded border-2 text-[10px] font-bold truncate ${customOptions.mouth === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                      >
                                         {opt}
                                      </button>
                                   ))}
                                </div>
                             </div>
                             {gender !== 'female' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">Facial Hair</label>
                                    <div className="grid grid-cols-3 gap-2">
                                    {availableOptions.facialHair.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => updateOption('facialHair', opt)}
                                            className={`p-1 rounded border-2 text-[10px] font-bold truncate ${customOptions.facialHair === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                        >
                                            {opt.replace('beard', '').replace('moustache', '')}
                                        </button>
                                    ))}
                                    </div>
                                </div>
                             )}
                          </>
                       )}

                       {/* CLOTHES TAB */}
                       {editorTab === 'clothes' && (
                          <>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Outfit</label>
                                <div className="grid grid-cols-2 gap-2">
                                   {availableOptions.clothing.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('clothing', opt)}
                                         className={`p-2 rounded border-2 text-[10px] font-bold truncate ${customOptions.clothing === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                      >
                                         {opt.replace(/([A-Z])/g, ' $1').trim()}
                                      </button>
                                   ))}
                                </div>
                             </div>
                          </>
                       )}

                       {/* ACCESSORIES TAB */}
                       {editorTab === 'access' && (
                          <>
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">Glasses / Accessories</label>
                                <div className="grid grid-cols-2 gap-2">
                                   {availableOptions.accessories.map((opt) => (
                                      <button
                                         key={opt}
                                         onClick={() => updateOption('accessories', opt)}
                                         className={`p-2 rounded border-2 text-[10px] font-bold truncate ${customOptions.accessories === opt ? 'border-primary-500 bg-primary-50' : 'border-gray-100'}`}
                                      >
                                         {opt}
                                      </button>
                                   ))}
                                </div>
                             </div>
                          </>
                       )}
                    </div>
                 </div>
              )}
           </div>
        </div>

      </motion.div>
    </div>
  )
}
