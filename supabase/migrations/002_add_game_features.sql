-- Migration to add features for game resume and player tracking

-- Add last_seen to players for heartbeat mechanism
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Add current_question_start_time to game_sessions for resume capability
ALTER TABLE game_sessions
ADD COLUMN IF NOT EXISTS current_question_start_time TIMESTAMPTZ;

-- Add index for cleanup performance
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(last_seen);
CREATE INDEX IF NOT EXISTS idx_game_sessions_finished_at ON game_sessions(finished_at);
