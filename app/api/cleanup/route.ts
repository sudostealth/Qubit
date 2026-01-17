import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Cleanup inactive players (active but last_seen > 1 minute ago)
    // We only clean up 'is_active' players so we don't re-process already inactive ones
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()

    const { error: playerError } = await supabase
      .from('players')
      .delete()
      .lt('last_seen', oneMinuteAgo)
      .eq('is_active', true)

    if (playerError) console.error('Player cleanup error:', playerError)

    // 2. Cleanup old sessions (finished > 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { error: sessionError } = await supabase
      .from('game_sessions')
      .delete()
      .lt('finished_at', oneHourAgo)
      .eq('status', 'finished')

    if (sessionError) console.error('Session cleanup error:', sessionError)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
