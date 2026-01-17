-- Ensure Cascading Deletes for Quiz Deletion

-- 1. Game Sessions (Cascade Delete from Quizzes)
ALTER TABLE game_sessions
DROP CONSTRAINT IF EXISTS game_sessions_quiz_id_fkey,
ADD CONSTRAINT game_sessions_quiz_id_fkey
  FOREIGN KEY (quiz_id)
  REFERENCES quizzes(id)
  ON DELETE CASCADE;

-- 2. Questions (Cascade Delete from Quizzes)
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_quiz_id_fkey,
ADD CONSTRAINT questions_quiz_id_fkey
  FOREIGN KEY (quiz_id)
  REFERENCES quizzes(id)
  ON DELETE CASCADE;

-- 3. Players (Cascade Delete from Game Sessions)
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_session_id_fkey,
ADD CONSTRAINT players_session_id_fkey
  FOREIGN KEY (session_id)
  REFERENCES game_sessions(id)
  ON DELETE CASCADE;

-- 4. Player Answers (Cascade Delete from Players and Questions)
ALTER TABLE player_answers
DROP CONSTRAINT IF EXISTS player_answers_player_id_fkey,
ADD CONSTRAINT player_answers_player_id_fkey
  FOREIGN KEY (player_id)
  REFERENCES players(id)
  ON DELETE CASCADE;

ALTER TABLE player_answers
DROP CONSTRAINT IF EXISTS player_answers_question_id_fkey,
ADD CONSTRAINT player_answers_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES questions(id)
  ON DELETE CASCADE;
