/**
 * Calculate points based on correctness and speed
 * 
 * @param isCorrect - Whether the answer was correct
 * @param timeTaken - Time taken to answer in milliseconds
 * @param timeLimit - Total time limit for the question in seconds
 * @param maxPoints - Maximum points for the question (default: 1000)
 * @returns Points earned
 */
export function calculatePoints(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number,
  maxPoints: number = 1000
): number {
  if (!isCorrect) return 0

  // Convert time limit to milliseconds
  const timeLimitMs = timeLimit * 1000

  // Calculate speed bonus (faster = more points)
  // Points = maxPoints * (1 - (timeTaken / timeLimitMs) * 0.5)
  // This means:
  // - Instant answer: 100% of points
  // - Answer at half time: 75% of points
  // - Answer at time limit: 50% of points
  const speedFactor = 1 - (timeTaken / timeLimitMs) * 0.5
  const points = Math.round(maxPoints * Math.max(speedFactor, 0.5))

  return points
}

/**
 * Format score with commas for display
 */
export function formatScore(score: number): string {
  return score.toLocaleString()
}
