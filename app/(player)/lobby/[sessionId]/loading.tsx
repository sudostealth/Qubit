import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
    </div>
  )
}
