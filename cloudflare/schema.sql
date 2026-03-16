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
