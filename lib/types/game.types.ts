/**
 * Game-specific types for Qubit
 */

export type GameStatus = 'waiting' | 'active' | 'finished'

export type QuestionType = 'multiple_choice' | 'true_false' | 'poll'

export interface QuizSettings {
  max_participants: number
  show_leaderboard: boolean
  randomize_questions: boolean
  randomize_answers: boolean
}

export interface Question {
  id: string
  quiz_id: string
  question_order: number
  text: string
  type: QuestionType
  options: string[]
  correct_answer: number | null
  time_limit: number
  points: number
  image_url?: string
  created_at: string
}

export interface Quiz {
  id: string
  creator_id: string
  title: string
  description?: string
  settings: QuizSettings
  is_public: boolean
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface GameSession {
  id: string
  quiz_id: string
  pin: string
  status: GameStatus
  current_question_index: number
  max_participants: number
  settings: Record<string, any>
  started_at?: string
  finished_at?: string
  created_at: string
}

export interface Player {
  id: string
  session_id: string
  nickname: string
  avatar_seed: string
  score: number
  is_active: boolean
  joined_at: string
}

export interface PlayerAnswer {
  id: string
  player_id: string
  question_id: string
  answer_index: number
  answered_at: string
  time_taken: number
  points_earned: number
  is_correct: boolean
}

export interface LeaderboardEntry {
  player_id: string
  nickname: string
  avatar_seed: string
  score: number
  rank: number
}

// Realtime broadcast events
export type GameEvent =
  | { type: 'game:start'; payload: { session_id: string } }
  | { type: 'question:show'; payload: { question_index: number; question: Question } }
  | { type: 'question:hide'; payload: { question_index: number } }
  | { type: 'timer:start'; payload: { duration: number } }
  | { type: 'timer:end'; payload: { question_index: number } }
  | { type: 'leaderboard:show'; payload: { leaderboard: LeaderboardEntry[] } }
  | { type: 'game:end'; payload: { session_id: string } }
  | { type: 'player:joined'; payload: { player: Player } }
  | { type: 'player:left'; payload: { player_id: string } }
