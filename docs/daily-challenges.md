# Daily Challenges

La primera versio del Daily Challenge reutilitza la taula `scores` i afegeix nomes una taula de metadata:

- `daily_challenges`

No hi ha una taula separada de resultats. El challenge leaderboard es calcula amb:

- el `game` del repte actiu
- la `date` del repte
- les scores d'aquell joc dins del dia del repte

## Model

Cada repte guarda:

- `id`
- `date`
- `game`
- `title`
- `description`
- `metric_type`
- `target_value`
- `is_active`
- `created_at`

## Crear o activar el repte del dia

Opcio simple:

```bash
npx wrangler d1 execute novarena-scores --remote --file cloudflare/daily-challenge-seed.sql
```

També pots fer-ho manualment:

```sql
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
```

## Endpoints

- `GET /api/challenge/current`
- `GET /api/challenge/leaderboard`
- `GET /api/challenge/leaderboard?challengeId=2026-03-16-snake-score&limit=10`

## Prova rapida

1. Activa un repte per un joc existent.
2. Envia scores d'aquell joc el mateix dia.
3. Obre `leaderboard.html` i comprova que la seccio de challenge mostra el ranking.
4. Obre la mateixa pagina en un altre navegador o en incognit per confirmar que el leaderboard es compartit.
