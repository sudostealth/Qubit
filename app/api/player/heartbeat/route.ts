import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('players')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', playerId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 })
  }
}
