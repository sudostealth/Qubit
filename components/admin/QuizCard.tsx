'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Play, Loader2 } from 'lucide-react'
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
      <div className="flex gap-2">
        <Link
          href={`/quiz/edit/${quiz.id}`}
          className="btn btn-secondary text-sm flex-1"
        >
          Edit
        </Link>
        <button
          onClick={handleStartGame}
          disabled={starting}
          className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-2"
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
