import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PlusCircle, List, LogOut, User } from 'lucide-react'
import QuizCard from '@/components/admin/QuizCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('creator_id', user?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-black gradient-text">
                Qubit
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Create and manage your quizzes
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/quiz/create" className="card-hover group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Create New Quiz</h3>
                <p className="text-gray-600">Start building your next quiz</p>
              </div>
            </div>
          </Link>

          <div className="card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <List className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">My Quizzes</h3>
                <p className="text-gray-600">{quizzes?.length || 0} quiz{quizzes?.length !== 1 ? 'zes' : ''} created</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Quizzes</h2>
          
          {!quizzes || quizzes.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No quizzes yet</h3>
              <p className="text-gray-600 mb-6">Create your first quiz to get started!</p>
              <Link href="/quiz/create" className="btn btn-primary inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Create Quiz
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
