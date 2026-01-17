-- Qubit Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{
    "max_participants": 100,
    "show_leaderboard": true,
    "randomize_questions": false,
    "randomize_answers": true
  }'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('multiple_choice', 'true_false', 'poll')) DEFAULT 'multiple_choice',
  options JSONB NOT NULL,
  correct_answer INTEGER,
  time_limit INTEGER DEFAULT 20,
  points INTEGER DEFAULT 1000,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  pin TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'active', 'finished')) DEFAULT 'waiting',
  current_question_index INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 100,
  settings JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_seed TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, nickname)
);

-- Create player_answers table
CREATE TABLE IF NOT EXISTS player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_index INTEGER NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  time_taken INTEGER,
  points_earned INTEGER DEFAULT 0,
  is_correct BOOLEAN
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, question_order);
CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON game_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_player_answers_player ON player_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_question ON player_answers(question_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for quizzes
CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = creator_id OR is_public = true);

CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for questions
CREATE POLICY "Users can view questions of their quizzes"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND (quizzes.creator_id = auth.uid() OR quizzes.is_public = true)
    )
  );

CREATE POLICY "Users can manage questions of their quizzes"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
  );

-- RLS Policies for game_sessions
CREATE POLICY "Anyone can view active game sessions by PIN"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "Quiz creators can manage game sessions"
  ON game_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = game_sessions.quiz_id
      AND quizzes.creator_id = auth.uid()
    )
  );

-- RLS Policies for players
CREATE POLICY "Anyone can view players in a session"
  ON players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join as a player"
  ON players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Players can update their own data"
  ON players FOR UPDATE
  USING (true);

-- RLS Policies for player_answers
CREATE POLICY "Players can view their own answers"
  ON player_answers FOR SELECT
  USING (true);

CREATE POLICY "Players can submit answers"
  ON player_answers FOR INSERT
  WITH CHECK (true);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Realtime for live game features
-- Note: Run these commands in the Supabase SQL Editor after creating the tables
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_answers;

-- Table comments for documentation
COMMENT ON TABLE profiles IS 'User profiles for quiz creators/organizers';
COMMENT ON TABLE quizzes IS 'Quiz templates created by organizers';
COMMENT ON TABLE questions IS 'Questions belonging to quizzes';
COMMENT ON TABLE game_sessions IS 'Live game instances';
COMMENT ON TABLE players IS 'Players participating in game sessions';
COMMENT ON TABLE player_answers IS 'Answers submitted by players';
