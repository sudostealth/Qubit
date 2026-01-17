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

/**
 * Generate avatar URL from seed
 */
export function getAvatarUrl(seed: string, style: AvatarStyle = 'fun-emoji'): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

/**
 * Generate random seed for avatar
 */
export function generateAvatarSeed(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Get next avatar style (for cycling through avatars)
 */
export function getNextAvatarStyle(currentStyle: AvatarStyle): AvatarStyle {
  const styles: AvatarStyle[] = ['fun-emoji', 'avataaars', 'bottts', 'lorelei', 'pixel-art']
  const currentIndex = styles.indexOf(currentStyle)
  const nextIndex = (currentIndex + 1) % styles.length
  return styles[nextIndex]
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
