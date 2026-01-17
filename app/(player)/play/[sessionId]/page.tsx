'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Trophy, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculatePoints } from '@/lib/utils/scoring'

interface Question {
  id: string
  text: string
  type: string
  options: string[]
  time_limit: number
  points: number
  image_url?: string
}

const answerColors = [
  { bg: 'bg-answer-red', hover: 'hover:bg-red-700', ring: 'ring-red-500' },
  { bg: 'bg-answer-blue', hover: 'hover:bg-blue-700', ring: 'ring-blue-500' },
  { bg: 'bg-answer-yellow', hover: 'hover:bg-yellow-600', ring: 'ring-yellow-500' },
  { bg: 'bg-answer-green', hover: 'hover:bg-green-700', ring: 'ring-green-500' },
]

export default function PlayPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const playerId = searchParams.get('playerId')

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [waitingForNext, setWaitingForNext] = useState(false)

  useEffect(() => {
    if (!sessionId || !playerId) return

    const supabase = createClient()

    // Subscribe to game events
    const gameChannel = supabase
      .channel(`game:${sessionId}`)
      .on('broadcast', { event: 'question:show' }, (payload: any) => {
        setCurrentQuestion(payload.payload.question)
        setQuestionIndex(payload.payload.index)
        setTimeLeft(payload.payload.question.time_limit)
        setSelectedAnswer(null)
        setAnswered(false)
        setShowFeedback(false)
        setWaitingForNext(false)
        setLoading(false)
      })
      .on('broadcast', { event: 'question:hide' }, () => {
        setShowFeedback(true)
        setWaitingForNext(true)
      })
      .on('broadcast', { event: 'timer:tick' }, (payload: any) => {
        setTimeLeft(payload.payload.timeLeft)
      })
      .on('broadcast', { event: 'game:end' }, () => {
        router.push(`/results/${sessionId}?playerId=${playerId}`)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [sessionId, playerId, router])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !answered && currentQuestion) {
      // Time's up - auto submit
      handleAnswer(null)
    }
  }, [timeLeft, answered, currentQuestion])

  const handleAnswer = async (answerIndex: number | null) => {
    if (answered || !currentQuestion) return

    setSelectedAnswer(answerIndex)
    setAnswered(true)

    const supabase = createClient()
    const timeTaken = (currentQuestion.time_limit - timeLeft) * 1000 // Convert to ms

    // Check if correct
    const correct = answerIndex !== null && currentQuestion.type !== 'poll' 
      ? answerIndex === (currentQuestion as any).correct_answer
      : false

    setIsCorrect(correct)

    // Calculate points
    const points = correct
      ? calculatePoints(true, timeTaken, currentQuestion.time_limit, currentQuestion.points)
      : 0

    setPointsEarned(points)

    // Save answer
    await supabase.from('player_answers').insert({
      player_id: playerId,
      question_id: currentQuestion.id,
      answer_index: answerIndex ?? -1,
      time_taken: timeTaken,
      points_earned: points,
      is_correct: correct,
    })

    // Update player score
    if (points > 0) {
      const { data: player } = await supabase
        .from('players')
        .select('score')
        .eq('id', playerId)
        .single()

      if (player) {
        await supabase
          .from('players')
          .update({ score: player.score + points })
          .eq('id', playerId)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Waiting for game to start...</p>
        </div>
      </div>
    )
  }

  if (waitingForNext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          {showFeedback && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-6 ${
                isCorrect ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {isCorrect ? (
                <span className="text-6xl">✓</span>
              ) : (
                <span className="text-6xl">✗</span>
              )}
            </motion.div>
          )}
          
          <h2 className="text-3xl font-bold mb-4">
            {isCorrect ? 'Correct!' : answered ? 'Incorrect' : "Time's Up!"}
          </h2>
          
          {pointsEarned > 0 && (
            <p className="text-2xl font-bold text-primary-600 mb-4">
              +{pointsEarned} points
            </p>
          )}
          
          <p className="text-gray-600">Waiting for next question...</p>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
          </div>
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              timeLeft > 5 ? 'bg-green-100' : 'bg-red-100 animate-pulse'
            }`}>
              <Timer className={`w-6 h-6 ${timeLeft > 5 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Left</p>
              <p className={`text-2xl font-bold ${timeLeft > 5 ? 'text-gray-900' : 'text-red-600'}`}>
                {timeLeft}s
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">Question</p>
            <p className="text-xl font-bold text-gray-900">{questionIndex + 1}</p>
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          {/* Question Text */}
          <div className="card mb-8 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              {currentQuestion.text}
            </h1>
            {currentQuestion.image_url && (
              <img
                src={currentQuestion.image_url}
                alt="Question"
                className="max-w-md mx-auto rounded-lg"
              />
            )}
          </div>

          {/* Answer Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {currentQuestion.options.map((option, index) => {
                const colors = answerColors[index % answerColors.length]
                const isSelected = selectedAnswer === index
                
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!answered ? { scale: 1.05 } : {}}
                    whileTap={!answered ? { scale: 0.95 } : {}}
                    onClick={() => !answered && handleAnswer(index)}
                    disabled={answered}
                    className={`answer-btn ${colors.bg} ${!answered ? colors.hover : ''} ${
                      isSelected ? `ring-4 ${colors.ring}` : ''
                    } ${answered ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-2xl md:text-3xl font-bold">{option}</span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
