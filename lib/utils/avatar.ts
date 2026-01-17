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

// Placeholders for custom/hero avatars (using DiceBear styles that look "cool" as defaults)
// In a real app, these would be URLs to custom assets
export const HERO_AVATARS = [
  { id: 'hero-1', seed: 'Midnight', style: 'adventurer', label: 'Ninja' },
  { id: 'hero-2', seed: 'Gizmo', style: 'adventurer', label: 'Tech Hero' },
  { id: 'hero-3', seed: 'Bandit', style: 'adventurer', label: 'Rogue' },
  { id: 'hero-4', seed: 'Princess', style: 'adventurer', label: 'Mage' },
  { id: 'hero-5', seed: 'Spooky', style: 'adventurer', label: 'Dark Knight' },
]

/**
 * Generate avatar URL from seed
 */
export function getAvatarUrl(seed: string, style: AvatarStyle = 'fun-emoji'): string {
  // Handle custom type if needed, but for now we map all to DiceBear
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
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
      return ['croodles'] // Abstract creatures
    case 'hero':
      return ['adventurer'] // RPG/Anime style
    case 'classic':
    default:
      return ['fun-emoji', 'avataaars', 'lorelei', 'pixel-art', 'notionists']
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
