import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizEditor from '@/components/admin/QuizEditor'

export default async function EditQuizPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', params.id)
    .eq('creator_id', user.id)
    .single()

  if (!quiz) {
    redirect('/dashboard')
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', params.id)
    .order('question_order', { ascending: true })

  return (
    <QuizEditor
      initialQuiz={{
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        settings: quiz.settings as any,
      }}
      initialQuestions={questions || []}
    />
  )
}
