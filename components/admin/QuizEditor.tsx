'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, GripVertical, Image as ImageIcon, Save, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { QuestionType } from '@/lib/types/game.types'

interface Question {
  id: string
  question_order: number
  text: string
  type: QuestionType
  options: string[]
  correct_answer: number | null
  time_limit: number
  points: number
  image_url?: string
}

interface QuizEditorProps {
  initialQuiz?: {
    id?: string
    title: string
    description?: string
    settings: {
      max_participants: number
      show_leaderboard: boolean
      randomize_questions: boolean
      randomize_answers: boolean
    }
  }
  initialQuestions?: Question[]
}

export default function QuizEditor({ initialQuiz, initialQuestions = [] }: QuizEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialQuiz?.title || '')
  const [description, setDescription] = useState(initialQuiz?.description || '')
  const [maxParticipants, setMaxParticipants] = useState(initialQuiz?.settings.max_participants || 100)
  const [showLeaderboard, setShowLeaderboard] = useState(initialQuiz?.settings.show_leaderboard ?? true)
  const [randomizeQuestions, setRandomizeQuestions] = useState(initialQuiz?.settings.randomize_questions ?? false)
  const [randomizeAnswers, setRandomizeAnswers] = useState(initialQuiz?.settings.randomize_answers ?? true)
  
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [createEmptyQuestion(0)]
  )
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function createEmptyQuestion(order: number): Question {
    return {
      id: `temp-${Date.now()}-${order}`,
      question_order: order,
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: 0,
      time_limit: 20,
      points: 1000,
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion(questions.length)])
  }

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return
    const newQuestions = questions.filter((_, i) => i !== index)
    // Reorder
    newQuestions.forEach((q, i) => {
      q.question_order = i
    })
    setQuestions(newQuestions)
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...questions]
    
    // Handle type change
    if (updates.type && updates.type !== newQuestions[index].type) {
      if (updates.type === 'true_false') {
        // Set to True/False options
        updates.options = ['True', 'False']
        updates.correct_answer = 0
      } else if (updates.type === 'multiple_choice' && newQuestions[index].type === 'true_false') {
        // Convert from true/false to multiple choice
        updates.options = ['', '', '', '']
        updates.correct_answer = 0
      }
    }
    
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setQuestions(newQuestions)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions]
    const newOptions = [...newQuestions[questionIndex].options]
    newOptions[optionIndex] = value
    newQuestions[questionIndex].options = newOptions
    setQuestions(newQuestions)
  }

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.push('')
    setQuestions(newQuestions)
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    if (newQuestions[questionIndex].options.length <= 2) return
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex)
    // Adjust correct answer if needed
    if (newQuestions[questionIndex].correct_answer === optionIndex) {
      newQuestions[questionIndex].correct_answer = 0
    } else if (newQuestions[questionIndex].correct_answer! > optionIndex) {
      newQuestions[questionIndex].correct_answer = newQuestions[questionIndex].correct_answer! - 1
    }
    setQuestions(newQuestions)
  }

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Quiz title is required')
      return
    }

    if (questions.some(q => !q.text.trim())) {
      setError('All questions must have text')
      return
    }

    if (questions.some(q => q.type !== 'poll' && q.correct_answer === null)) {
      setError('All questions must have a correct answer (except polls)')
      return
    }

    if (questions.some(q => q.options.some(o => !o.trim()))) {
      setError('All answer options must be filled in')
      return
    }

    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to save a quiz')
        setSaving(false)
        return
      }

      // Save or update quiz
      let quizId = initialQuiz?.id

      if (quizId) {
        // Update existing quiz
        const { error: quizError } = await supabase
          .from('quizzes')
          .update({
            title,
            description,
            settings: {
              max_participants: maxParticipants,
              show_leaderboard: showLeaderboard,
              randomize_questions: randomizeQuestions,
              randomize_answers: randomizeAnswers,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', quizId)

        if (quizError) throw quizError

        // Delete old questions
        await supabase.from('questions').delete().eq('quiz_id', quizId)
      } else {
        // Create new quiz
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .insert({
            creator_id: user.id,
            title,
            description,
            settings: {
              max_participants: maxParticipants,
              show_leaderboard: showLeaderboard,
              randomize_questions: randomizeQuestions,
              randomize_answers: randomizeAnswers,
            },
          })
          .select()
          .single()

        if (quizError) throw quizError
        quizId = quiz.id
      }

      // Insert questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quizId,
        question_order: index,
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.type === 'poll' ? null : q.correct_answer,
        time_limit: q.time_limit,
        points: q.points,
        image_url: q.image_url,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to save quiz')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold gradient-text">
                {initialQuiz?.id ? 'Edit Quiz' : 'Create Quiz'}
              </h1>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
          >
            {error}
          </motion.div>
        )}

        {/* Quiz Settings */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quiz Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={3}
                placeholder="Brief description of your quiz"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 100)}
                  className="input"
                  min={1}
                  max={500}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLeaderboard}
                    onChange={(e) => setShowLeaderboard(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Leaderboard</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={randomizeQuestions}
                    onChange={(e) => setRandomizeQuestions(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Randomize Questions</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={randomizeAnswers}
                    onChange={(e) => setRandomizeAnswers(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Randomize Answers</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Questions ({questions.length})
            </h2>
            <button
              onClick={addQuestion}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>

          <AnimatePresence>
            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-2">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-500">
                        Question {index + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text *
                      </label>
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(index, { text: e.target.value })}
                        className="input"
                        rows={2}
                        placeholder="Enter your question"
                        required
                      />
                    </div>

                    {/* Question Type & Settings */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                          className="input"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="true_false">True/False</option>
                          <option value="poll">Poll (No Correct Answer)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit (seconds)
                        </label>
                        <input
                          type="number"
                          value={question.time_limit}
                          onChange={(e) => updateQuestion(index, { time_limit: parseInt(e.target.value) || 20 })}
                          className="input"
                          min={5}
                          max={120}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) || 1000 })}
                          className="input"
                          min={100}
                          max={2000}
                          step={100}
                        />
                      </div>
                    </div>

                    {/* Answer Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer Options *
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateQuestion(index, { correct_answer: optionIndex })}
                              disabled={question.type === 'poll'}
                              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                question.correct_answer === optionIndex
                                  ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-1'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                              }`}
                              title={question.correct_answer === optionIndex ? 'Correct Answer' : 'Mark as Correct'}
                            >
                              <CheckCircle className={`w-4 h-4 ${question.correct_answer === optionIndex ? 'fill-current' : ''}`} />
                              <span className="hidden sm:inline">
                                {question.correct_answer === optionIndex ? 'Correct' : 'Mark Correct'}
                              </span>
                            </button>

                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              className={`input flex-1 transition-colors ${
                                question.correct_answer === optionIndex ? 'border-green-500 bg-green-50' : ''
                              }`}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                            {question.options.length > 2 && question.type !== 'true_false' && (
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {question.options.length < 6 && question.type !== 'true_false' && (
                        <button
                          onClick={() => addOption(index)}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end gap-4">
          <Link href="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </main>
    </div>
  )
}
