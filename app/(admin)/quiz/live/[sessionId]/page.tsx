'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, SkipForward, Trophy, Users, Eye, EyeOff, X, BarChart2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, type AvatarStyle } from '@/lib/utils/avatar'
import Image from 'next/image'

interface Question {
  id: string
  question_order: number
  text: string
  type: string
  options: string[]
  correct_answer: number | null
  time_limit: number
  points: number
}

interface Player {
  id: string
  nickname: string
  avatar_seed: string
  score: number
}

export default function LiveGamePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [players, setPlayers] = useState<Player[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [answerStats, setAnswerStats] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionActive, setQuestionActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quizTitle, setQuizTitle] = useState('')

  useEffect(() => {
    if (!sessionId) return

    const fetchData = async () => {
      const supabase = createClient()

      // Get session with quiz and questions
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*, quizzes(title, questions(*))')
        .eq('id', sessionId)
        .single()

      if (session && session.quizzes) {
        setQuizTitle(session.quizzes.title)
        const sortedQuestions = (session.quizzes.questions || []).sort(
          (a: any, b: any) => a.question_order - b.question_order
        )
        setQuestions(sortedQuestions)
        setCurrentQuestionIndex(session.current_question_index || 0)
      }

      // Get players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('score', { ascending: false })

      if (playersData) {
        setPlayers(playersData)
      }

      setLoading(false)
    }

    fetchData()

    // Subscribe to player score updates
    const supabase = createClient()
    const playersChannel = supabase
      .channel(`live:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'players',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setPlayers((prev) =>
            prev
              .map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
              .sort((a, b) => b.score - a.score)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(playersChannel)
    }
  }, [sessionId])

  // Timer countdown
  useEffect(() => {
    if (questionActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        const newTime = timeLeft - 1
        setTimeLeft(newTime)

        // Broadcast timer tick
        const supabase = createClient()
        supabase.channel(`game:${sessionId}`).send({
          type: 'broadcast',
          event: 'timer:tick',
          payload: { timeLeft: newTime },
        })
      }, 1000)
      return () => clearTimeout(timer)
    } else if (questionActive && timeLeft === 0) {
      // Time's up - hide question
      handleHideQuestion()
    }
  }, [timeLeft, questionActive, sessionId])

  const handleShowQuestion = async () => {
    if (currentQuestionIndex >= questions.length) return

    const question = questions[currentQuestionIndex]
    setTimeLeft(question.time_limit)
    setQuestionActive(true)

    // Broadcast question to all players
    const supabase = createClient()
    await supabase.channel(`game:${sessionId}`).send({
      type: 'broadcast',
      event: 'question:show',
      payload: {
        question,
        index: currentQuestionIndex,
      },
    })

    // Update session
    await supabase
      .from('game_sessions')
      .update({ current_question_index: currentQuestionIndex })
      .eq('id', sessionId)
  }

  const handleHideQuestion = async () => {
    setQuestionActive(false)

    const supabase = createClient()

    // Fetch stats
    const { data: answers } = await supabase
      .from('player_answers')
      .select('answer_index')
      .eq('question_id', questions[currentQuestionIndex].id)

    const stats = new Array(questions[currentQuestionIndex].options.length).fill(0)
    answers?.forEach((a: any) => {
      if (a.answer_index >= 0 && a.answer_index < stats.length) {
        stats[a.answer_index]++
      }
    })
    setAnswerStats(stats)

    // Broadcast stats
    await supabase.channel(`game:${sessionId}`).send({
      type: 'broadcast',
      event: 'stats:show',
      payload: { stats }
    })

    // Show stats
    setShowStats(true)
  }

  const handleShowLeaderboard = async () => {
    setShowStats(false)
    setShowLeaderboard(true)

    const supabase = createClient()
    await supabase.channel(`game:${sessionId}`).send({
      type: 'broadcast',
      event: 'leaderboard:show'
    })
  }

  const handleNextQuestion = () => {
    setShowLeaderboard(false)
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  }

  const handleEndGame = async () => {
    const supabase = createClient()
    
    // Update session status
    await supabase
      .from('game_sessions')
      .update({ status: 'finished', finished_at: new Date().toISOString() })
      .eq('id', sessionId)

    // Broadcast end event
    await supabase.channel(`game:${sessionId}`).send({
      type: 'broadcast',
      event: 'game:end',
    })

    // Redirect to results
    router.push(`/results/${sessionId}`)
  }

  const parseAvatarSeed = (seed: string): { style: AvatarStyle; seed: string } => {
    const [style, actualSeed] = seed.split(':')
    return { style: style as AvatarStyle, seed: actualSeed }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= questions.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">{quizTitle}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Players</p>
                <p className="text-2xl font-bold text-gray-900">{players.length}</p>
              </div>

              {questionActive && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Left</p>
                  <p className={`text-3xl font-bold ${timeLeft > 5 ? 'text-gray-900' : 'text-red-600'}`}>
                    {timeLeft}s
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Display */}
            {currentQuestion && !showLeaderboard && !showStats && (
              <div className="card">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {currentQuestion.text}
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg font-bold text-lg bg-gray-100"
                    >
                      {option}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Time Limit: {currentQuestion.time_limit}s</span>
                  <span>Points: {currentQuestion.points}</span>
                </div>
              </div>
            )}

            {/* Stats Display */}
            {showStats && currentQuestion && (
              <div className="card">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Answer Breakdown
                </h2>
                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => {
                    const count = answerStats[index] || 0
                    const total = answerStats.reduce((a, b) => a + b, 0) || 1
                    const percentage = Math.round((count / total) * 100)
                    const isCorrect = currentQuestion.correct_answer === index

                    return (
                      <div key={index} className={`relative p-4 rounded-lg border-2 overflow-hidden ${
                        isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                         {/* Progress Bar Background */}
                         <div
                            className={`absolute inset-0 opacity-20 transition-all duration-1000 ${isCorrect ? 'bg-green-500' : 'bg-gray-400'}`}
                            style={{ width: `${percentage}%` }}
                         />
                         <div className="relative flex justify-between items-center z-10">
                            <span className="font-bold text-lg">{option}</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">{count} picks</span>
                                {isCorrect && <CheckCircle className="text-green-600 w-6 h-6" />}
                            </div>
                         </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {showLeaderboard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Current Standings
                </h2>

                <div className="space-y-3">
                  {players.slice(0, 10).map((player, index) => {
                    const { style, seed } = parseAvatarSeed(player.avatar_seed)
                    const avatarUrl = getAvatarUrl(seed, style)

                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-2xl font-bold text-gray-400 w-8">
                          {index + 1}
                        </span>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-1">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden">
                            <Image
                              src={avatarUrl}
                              alt={player.nickname}
                              width={48}
                              height={48}
                              className="w-full h-full"
                              unoptimized
                            />
                          </div>
                        </div>
                        <span className="flex-1 font-bold text-gray-900">
                          {player.nickname}
                        </span>
                        <span className="text-xl font-bold text-primary-600">
                          {player.score}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="card">
              <div className="flex gap-4">
                {!questionActive && !showLeaderboard && !showStats && currentQuestionIndex < questions.length && (
                  <button
                    onClick={handleShowQuestion}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Show Question
                  </button>
                )}

                {questionActive && (
                  <button
                    onClick={handleHideQuestion}
                    className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <EyeOff className="w-5 h-5" />
                    Hide Question & Show Stats
                  </button>
                )}

                {showStats && (
                  <button
                    onClick={handleShowLeaderboard}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    Show Leaderboard
                  </button>
                )}

                {showLeaderboard && !isLastQuestion && (
                  <button
                    onClick={handleNextQuestion}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    Next Question
                  </button>
                )}

                {showLeaderboard && isLastQuestion && (
                  <button
                    onClick={handleEndGame}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    End Game
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Live Players */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Live Players ({players.length})
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {players.map((player) => {
                  const { style, seed } = parseAvatarSeed(player.avatar_seed)
                  const avatarUrl = getAvatarUrl(seed, style)

                  return (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 p-1">
                        <div className="w-full h-full rounded-full bg-white overflow-hidden">
                          <Image
                            src={avatarUrl}
                            alt={player.nickname}
                            width={40}
                            height={40}
                            className="w-full h-full"
                            unoptimized
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">
                          {player.nickname}
                        </p>
                        <p className="text-xs text-gray-500">{player.score} pts</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
