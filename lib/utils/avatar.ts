/**
 * DiceBear avatar utilities
 * Uses DiceBear API to generate unique avatars for players
 */

export type AvatarStyle = 
  | 'avataaars'
  | 'bottts'
  | 'fun-emoji'
  | 'lorelei'
  | 'pixel-art'
  | 'adventurer'
  | 'croodles'
  | 'notionists'
  | 'custom'

// Categories for UI grouping
export type AvatarCategory = 'classic' | 'robot' | 'creature' | 'hero'

export type Gender = 'male' | 'female' | 'neutral'

// Configuration Options for Avataaars (DiceBear 7.x / Avataaars Library Standard)
export const AVATAR_CONFIG = {
  top: [
    // Long Hair (Feminine/Neutral)
    'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy',
    'LongHairDreads', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand',
    'LongHairNotTooLong', 'LongHairShavedSides', 'LongHairMiaWallace',
    'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand',
    // Short Hair (Masculine/Neutral)
    'NoHair', 'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle',
    'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat',
    'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides',
    'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart',
    // Hats (Neutral)
    'Eyepatch', 'Hat', 'Hijab', 'Turban',
    'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4'
  ],
  accessories: [
    'Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'
  ],
  hairColor: [
    'Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark',
    'PastelPink', 'Blue', 'Platinum', 'Red', 'SilverGray'
  ],
  facialHair: [
    'Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'
  ],
  clothing: [
    'BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie',
    'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'
  ],
  eyes: [
    'Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side',
    'Squint', 'Surprised', 'Wink', 'WinkWacky'
  ],
  eyebrow: [
    'Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural',
    'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural',
    'UnibrowNatural', 'UpDown', 'UpDownNatural'
  ],
  mouth: [
    'Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad',
    'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'
  ],
  skinColor: [
    'Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'
  ]
} as const

// Filtered Lists for Gender Logic
export const GENDER_FILTERS = {
  male: {
    top: [
      'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle',
      'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat',
      'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides',
      'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart', 'NoHair',
      'Eyepatch', 'Hat', 'Turban', 'WinterHat1', 'WinterHat2', 'WinterHat3'
    ],
    facialHair: AVATAR_CONFIG.facialHair // All beards allowed
  },
  female: {
    top: [
      'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy',
      'LongHairDreads', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand',
      'LongHairNotTooLong', 'LongHairShavedSides', 'LongHairMiaWallace',
      'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand',
      'Hijab', 'WinterHat4'
    ],
    facialHair: ['Blank'] // No beards
  }
} as const

// Placeholders for custom/hero avatars
export const HERO_AVATARS = [
  { id: 'hero-1', seed: 'Midnight', style: 'adventurer', label: 'Ninja' },
  { id: 'hero-2', seed: 'Gizmo', style: 'adventurer', label: 'Tech Hero' },
  { id: 'hero-3', seed: 'Bandit', style: 'adventurer', label: 'Rogue' },
  { id: 'hero-4', seed: 'Princess', style: 'adventurer', label: 'Mage' },
  { id: 'hero-5', seed: 'Spooky', style: 'adventurer', label: 'Dark Knight' },
]

/**
 * Generate avatar URL from seed
 * Supports seeds with appended query params (e.g. "myseed&top=Hat")
 */
export function getAvatarUrl(seed: string, style: AvatarStyle = 'fun-emoji'): string {
  // Check if seed has custom options embedded
  let baseSeed = seed
  let options = ''

  if (seed.includes('&')) {
    const parts = seed.split('&')
    baseSeed = parts[0]
    // Reconstruct the rest as query params
    options = '&' + parts.slice(1).join('&')
  }

  // Handle custom type if needed, but for now we map all to DiceBear
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(baseSeed)}${options}`
}

/**
 * Generate random seed for avatar
 */
export function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Get available styles for a category
 */
export function getStylesForCategory(category: AvatarCategory): AvatarStyle[] {
  switch (category) {
    case 'robot':
      return ['bottts']
    case 'creature':
      return ['croodles']
    case 'hero':
      return ['adventurer']
    case 'classic':
    default:
      // Prioritize avataaars for the main human category due to high customization
      return ['avataaars', 'notionists', 'fun-emoji', 'lorelei', 'pixel-art']
  }
}

/**
 * Generate a new random avatar
 */
export function generateRandomAvatar(style: AvatarStyle = 'fun-emoji'): {
  seed: string
  url: string
  style: AvatarStyle
} {
  const seed = generateAvatarSeed()
  return {
    seed,
    url: getAvatarUrl(seed, style),
    style,
  }
}
