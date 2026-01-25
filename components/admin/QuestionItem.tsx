'use client'

import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Trash2, CheckCircle, Copy } from 'lucide-react'
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

interface QuestionItemProps {
  question: Question
  index: number
  totalQuestions: number
  onUpdate: (index: number, updates: Partial<Question>) => void
  onRemove: (index: number) => void
  onDuplicate: (index: number) => void
  onAddOption: (index: number) => void
  onRemoveOption: (index: number, optionIndex: number) => void
  onUpdateOption: (index: number, optionIndex: number, value: string) => void
}

export default function QuestionItem({
  question,
  index,
  totalQuestions,
  onUpdate,
  onRemove,
  onDuplicate,
  onAddOption,
  onRemoveOption,
  onUpdateOption
}: QuestionItemProps) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card relative"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div
          onPointerDown={(e) => controls.start(e)}
          className="flex-shrink-0 mt-2 cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>

        <div className="flex-1 space-y-4">
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">
              Question {index + 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDuplicate(index)}
                className="text-gray-500 hover:text-primary-600 transition-colors p-1"
                title="Duplicate Question"
              >
                <Copy className="w-5 h-5" />
              </button>
              {totalQuestions > 1 && (
                <button
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-700 transition-colors p-1"
                  title="Remove Question"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={question.text}
              onChange={(e) => onUpdate(index, { text: e.target.value })}
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
                onChange={(e) => onUpdate(index, { type: e.target.value as QuestionType })}
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
                onChange={(e) => onUpdate(index, { time_limit: parseInt(e.target.value) || 20 })}
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
                onChange={(e) => onUpdate(index, { points: parseInt(e.target.value) || 1000 })}
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
                    onClick={() => onUpdate(index, { correct_answer: optionIndex })}
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
                    onChange={(e) => onUpdateOption(index, optionIndex, e.target.value)}
                    className={`input flex-1 transition-colors ${
                      question.correct_answer === optionIndex ? 'border-green-500 bg-green-50' : ''
                    }`}
                    placeholder={`Option ${optionIndex + 1}`}
                    required
                  />
                  {question.options.length > 2 && question.type !== 'true_false' && (
                    <button
                      onClick={() => onRemoveOption(index, optionIndex)}
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
                onClick={() => onAddOption(index)}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add Option
              </button>
            )}
          </div>
        </div>
      </div>
    </Reorder.Item>
  )
}
