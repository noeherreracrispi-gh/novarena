UPDATE daily_challenges
SET is_active = 0;

INSERT INTO daily_challenges (
  id,
  date,
  game,
  title,
  description,
  metric_type,
  target_value,
  is_active,
  created_at
) VALUES (
  '2026-03-16-snake-score',
  '2026-03-16',
  'snake',
  'Snake Daily Challenge',
  'Beat 200 points in Snake.',
  'score',
  200,
  1,
  '2026-03-16T00:00:00.000Z'
);
