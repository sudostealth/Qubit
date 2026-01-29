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

// Configuration Options for Avataaars
export const AVATAR_CONFIG = {
  top: [
    'shortHair', 'longHair', 'eyepatch', 'hat', 'hijab', 'turban',
    'winterHat1', 'winterHat2', 'winterHat3', 'bob', 'bun', 'curly', 'curvy', 'dreads',
    'frida', 'fro', 'froBand', 'miaWallace', 'shavedSides', 'straight01', 'straight02', 'straightStrand'
  ],
  accessories: ['none', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'],
  hairColor: ['auburn', 'black', 'blonde', 'blondeGolden', 'brown', 'brownDark', 'pastelPink', 'platinum', 'red', 'silverGray'],
  facialHair: ['none', 'beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'],
  clothing: ['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
  eyes: ['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky'],
  eyebrow: ['default', 'angry', 'angryNatural', 'flatNatural', 'frownNatural', 'raisedExcited', 'sadConcerned', 'unibrowNatural', 'upDown', 'upDownNatural'],
  mouth: ['default', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
  skinColor: ['tanned', 'yellow', 'pale', 'light', 'brown', 'darkBrown', 'black']
}

// Filtered Lists for Gender Logic
export const GENDER_FILTERS = {
  male: {
    top: ['shortHair', 'shavedSides', 'curly', 'dreads', 'fro', 'hat', 'winterHat1', 'winterHat2', 'turban', 'eyepatch'],
    facialHair: AVATAR_CONFIG.facialHair // All beards allowed
  },
  female: {
    top: ['longHair', 'bob', 'bun', 'curvy', 'frida', 'froBand', 'miaWallace', 'straight01', 'straight02', 'straightStrand', 'hijab'],
    facialHair: ['none'] // No beards
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
 * Supports seeds with appended query params (e.g. "myseed&top=hat")
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
