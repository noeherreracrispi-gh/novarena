CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score REAL NOT NULL,
  score_type TEXT NOT NULL DEFAULT 'points',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_global_leaderboard
ON scores (score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_game_leaderboard
ON scores (game, score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scores_created_at
ON scores (created_at DESC);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  game TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metric_type TEXT NOT NULL DEFAULT 'score',
  target_value REAL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_active_date
ON daily_challenges (is_active, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date
ON daily_challenges (date DESC);
