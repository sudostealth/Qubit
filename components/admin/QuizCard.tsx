'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generatePin } from '@/lib/utils/pin-generator'

interface QuizCardProps {
  quiz: {
    id: string
    title: string
    description: string | null
    settings: any
  }
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? All related data (questions, sessions, players) will be permanently removed.')) {
      return
    }

    setDeleting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id)

      if (error) throw error

      router.refresh()
    } catch (err) {
      console.error('Error deleting quiz:', err)
      alert('Failed to delete quiz')
    } finally {
      setDeleting(false)
    }
  }

  const handleStartGame = async () => {
    setStarting(true)

    try {
      const supabase = createClient()
      
      // Generate unique PIN
      let pin = generatePin()
      let isUnique = false
      
      while (!isUnique) {
        const { data: existing } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('pin', pin)
          .single()
        
        if (!existing) {
          isUnique = true
        } else {
          pin = generatePin()
        }
      }

      // Clean up old waiting/active sessions for this quiz to ensure fresh start
      // This prevents confusion if an admin accidentally left a previous session running
      await supabase
        .from('game_sessions')
        .delete()
        .eq('quiz_id', quiz.id)
        .in('status', ['waiting', 'active'])

      // Create game session
      const { data: session, error } = await supabase
        .from('game_sessions')
        .insert({
          quiz_id: quiz.id,
          pin,
          status: 'waiting',
          current_question_index: 0,
          max_participants: quiz.settings?.max_participants || 100,
          settings: quiz.settings || {},
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to controller
      router.push(`/quiz/controller/${session.id}`)
    } catch (err) {
      console.error('Error starting game:', err)
      setStarting(false)
    }
  }

  return (
    <div className="card-hover">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{quiz.title}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {quiz.description || 'No description'}
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Link
            href={`/quiz/edit/${quiz.id}`}
            className="btn btn-secondary text-sm flex-1 text-center"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn bg-red-100 text-red-600 hover:bg-red-200 text-sm px-4"
            title="Delete Quiz"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
        <button
          onClick={handleStartGame}
          disabled={starting}
          className="btn btn-primary text-sm w-full flex items-center justify-center gap-2"
        >
          {starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Game
            </>
          )}
        </button>
      </div>
    </div>
  )
}
