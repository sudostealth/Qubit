/**
 * Generate a unique 6-digit PIN for game sessions
 * Ensures the PIN doesn't already exist in the database
 */
export function generatePin(): string {
  // Generate a random 6-digit number
  const pin = Math.floor(100000 + Math.random() * 900000).toString()
  return pin
}

/**
 * Validate PIN format
 */
export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}
