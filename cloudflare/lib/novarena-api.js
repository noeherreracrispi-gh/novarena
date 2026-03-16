var GAME_ID_ALIASES = {
  'runner-3d': 'runner3d'
};

var DEFAULT_LIMIT = 10;
var MAX_LIMIT = 100;
var DEFAULT_PROFILE_RECENT_LIMIT = 6;
var MAX_PROFILE_RECENT_LIMIT = 20;
var CURRENT_CHALLENGE_QUERY = [
  'SELECT id, date, game, title, description, metric_type, target_value, is_active, created_at',
  'FROM daily_challenges',
  'WHERE is_active = 1',
  'ORDER BY date DESC, created_at DESC',
  'LIMIT 1'
].join(' ');
var CHALLENGE_BY_ID_QUERY = [
  'SELECT id, date, game, title, description, metric_type, target_value, is_active, created_at',
  'FROM daily_challenges',
  'WHERE id = ?1',
  'LIMIT 1'
].join(' ');
var CHALLENGE_LEADERBOARD_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, created_at DESC) AS rn',
  '  FROM scores',
  '  WHERE game = ?1',
  '  AND created_at >= ?2',
  '  AND created_at < ?3',
  ') ranked_scores',
  'WHERE rn = 1',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?4'
].join(' ');
var GAME_LEADERBOARD_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, created_at DESC) AS rn',
  '  FROM scores',
  '  WHERE game = ?1',
  ') ranked_scores',
  'WHERE rn = 1',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?2'
].join(' ');
var GLOBAL_LEADERBOARD_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, created_at DESC) AS rn',
  '  FROM scores',
  ') ranked_scores',
  'WHERE rn = 1',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?1'
].join(' ');
var PROFILE_BEST_GLOBAL_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM scores',
  'WHERE player_id = ?1',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT 1'
].join(' ');
var PROFILE_BEST_PER_GAME_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (PARTITION BY game ORDER BY score DESC, created_at DESC) AS rn',
  '  FROM scores',
  '  WHERE player_id = ?1',
  ') ranked_scores',
  'WHERE rn = 1',
  'ORDER BY score DESC, created_at DESC'
].join(' ');
var PROFILE_RECENT_ACTIVITY_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM scores',
  'WHERE player_id = ?1',
  'ORDER BY created_at DESC, id DESC',
  'LIMIT ?2'
].join(' ');
var PROFILE_ACTIVE_CHALLENGE_RANK_QUERY = [
  'WITH ranked_scores AS (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (PARTITION BY player_id ORDER BY score DESC, created_at DESC) AS player_rn',
  '  FROM scores',
  '  WHERE game = ?1',
  '  AND created_at >= ?2',
  '  AND created_at < ?3',
  '), leaderboard AS (',
  '  SELECT id, game, player_id, player_name, score, score_type, created_at,',
  '         ROW_NUMBER() OVER (ORDER BY score DESC, created_at DESC) AS challenge_rank,',
  '         COUNT(*) OVER () AS total_players',
  '  FROM ranked_scores',
  '  WHERE player_rn = 1',
  ')',
  'SELECT id, game, player_id, player_name, score, score_type, created_at, challenge_rank, total_players',
  'FROM leaderboard',
  'WHERE player_id = ?4',
  'LIMIT 1'
].join(' ');

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function canonicalGameId(gameId) {
  if (!gameId) {
    return '';
  }

  var value = String(gameId).trim();
  return GAME_ID_ALIASES[value] || value;
}

export function corsHeaders(extraHeaders) {
  return Object.assign({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  }, extraHeaders || {});
}

export function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload, null, 2), {
    status: status || 200,
    headers: corsHeaders({
      'Content-Type': 'application/json; charset=utf-8'
    })
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export function errorResponse(error) {
  if (error instanceof HttpError) {
    return jsonResponse({
      ok: false,
      error: error.message
    }, error.status);
  }

  return jsonResponse({
    ok: false,
    error: 'Internal server error'
  }, 500);
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

function normalizeText(value, fieldName, maxLength) {
  var normalized = String(value == null ? '' : value).trim();

  if (!normalized) {
    throw new HttpError(400, fieldName + ' is required');
  }

  return normalized.slice(0, maxLength);
}

function normalizeOptionalText(value, maxLength) {
  var normalized = String(value == null ? '' : value).trim();

  if (!normalized) {
    return '';
  }

  return normalized.slice(0, maxLength);
}

function normalizeCreatedAt(value) {
  var raw = value ? new Date(value) : new Date();

  if (Number.isNaN(raw.getTime())) {
    return new Date().toISOString();
  }

  return raw.toISOString();
}

export function normalizeScorePayload(payload) {
  var score = Number(payload && payload.score);

  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Score payload is required');
  }

  if (!Number.isFinite(score)) {
    throw new HttpError(400, 'score must be numeric');
  }

  return {
    game: canonicalGameId(normalizeText(payload.game, 'game', 64)),
    playerId: normalizeText(payload.playerId, 'playerId', 128),
    playerName: normalizeText(payload.playerName, 'playerName', 64),
    score: score,
    scoreType: normalizeText(payload.scoreType || 'points', 'scoreType', 32),
    createdAt: normalizeCreatedAt(payload.createdAt)
  };
}

export function parseLeaderboardRequest(requestUrl) {
  var game = requestUrl.searchParams.get('game');
  var limit = Number(requestUrl.searchParams.get('limit'));

  return {
    game: game ? canonicalGameId(game) : null,
    limit: Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT
  };
}

export function parseChallengeLeaderboardRequest(requestUrl) {
  var challengeId = requestUrl.searchParams.get('challengeId');
  var limit = Number(requestUrl.searchParams.get('limit'));

  return {
    challengeId: challengeId ? String(challengeId).trim() : null,
    limit: Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT
  };
}

export function parseProfileRequest(requestUrl) {
  var playerId = requestUrl.searchParams.get('playerId');
  var playerName = requestUrl.searchParams.get('playerName');
  var recentLimit = Number(requestUrl.searchParams.get('recentLimit'));

  if (!String(playerId || '').trim()) {
    throw new HttpError(400, 'playerId is required');
  }

  return {
    playerId: normalizeText(playerId, 'playerId', 128),
    playerName: normalizeOptionalText(playerName, 64),
    recentLimit: Number.isFinite(recentLimit) && recentLimit > 0
      ? Math.min(Math.floor(recentLimit), MAX_PROFILE_RECENT_LIMIT)
      : DEFAULT_PROFILE_RECENT_LIMIT
  };
}

function requireDatabase(env) {
  if (!env || !env.NOVARENA_DB) {
    throw new HttpError(500, 'NOVARENA_DB binding is not configured');
  }

  return env.NOVARENA_DB;
}

function mapScoreRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    game: canonicalGameId(row.game),
    playerId: row.player_id,
    playerName: row.player_name,
    score: Number(row.score),
    scoreType: row.score_type,
    createdAt: row.created_at
  };
}

function mapChallengeRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    date: String(row.date),
    game: canonicalGameId(row.game),
    title: String(row.title),
    description: String(row.description),
    metricType: String(row.metric_type || 'score'),
    targetValue: row.target_value == null ? null : Number(row.target_value),
    isActive: Number(row.is_active) === 1,
    createdAt: row.created_at || null
  };
}

function mapProfileChallengeEntry(row) {
  if (!row) {
    return {
      rank: null,
      totalPlayers: 0,
      entry: null
    };
  }

  return {
    rank: Number(row.challenge_rank),
    totalPlayers: Number(row.total_players || 0),
    entry: mapScoreRow(row)
  };
}

function buildChallengeWindow(dateValue) {
  var start = new Date(String(dateValue) + 'T00:00:00.000Z');
  var end;

  if (Number.isNaN(start.getTime())) {
    throw new HttpError(500, 'Challenge date is invalid');
  }

  end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

export async function insertScore(env, entry) {
  var database = requireDatabase(env);
  var result = await database.prepare([
    'INSERT INTO scores (game, player_id, player_name, score, score_type, created_at)',
    'VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  ].join(' ')).bind(
    entry.game,
    entry.playerId,
    entry.playerName,
    entry.score,
    entry.scoreType,
    entry.createdAt
  ).run();

  return Object.assign({
    id: result.meta && result.meta.last_row_id ? result.meta.last_row_id : null
  }, entry);
}

export async function getLeaderboard(env, options) {
  var database = requireDatabase(env);
  var normalized = options || {};
  var statement;

  if (normalized.game) {
    // Match idx_scores_game_leaderboard: (game, score DESC, created_at DESC).
    statement = database.prepare(GAME_LEADERBOARD_QUERY).bind(
      normalized.game,
      normalized.limit || DEFAULT_LIMIT
    );
  } else {
    statement = database.prepare(GLOBAL_LEADERBOARD_QUERY).bind(normalized.limit || DEFAULT_LIMIT);
  }

  var result = await statement.all();
  var rows = result && Array.isArray(result.results) ? result.results : [];

  return rows.map(mapScoreRow);
}

export async function getCurrentChallenge(env) {
  var database = requireDatabase(env);
  var result = await database.prepare(CURRENT_CHALLENGE_QUERY).all();
  var rows = result && Array.isArray(result.results) ? result.results : [];

  return mapChallengeRow(rows[0] || null);
}

export async function getChallengeById(env, challengeId) {
  if (!challengeId) {
    return null;
  }

  var database = requireDatabase(env);
  var result = await database.prepare(CHALLENGE_BY_ID_QUERY).bind(String(challengeId)).all();
  var rows = result && Array.isArray(result.results) ? result.results : [];

  return mapChallengeRow(rows[0] || null);
}

export async function getChallengeLeaderboard(env, options) {
  var normalized = options || {};
  var database = requireDatabase(env);
  var challenge = normalized.challengeId
    ? await getChallengeById(env, normalized.challengeId)
    : await getCurrentChallenge(env);
  var window;
  var result;
  var rows;

  if (!challenge) {
    return {
      challenge: null,
      entries: []
    };
  }

  window = buildChallengeWindow(challenge.date);
  result = await database.prepare(CHALLENGE_LEADERBOARD_QUERY).bind(
    challenge.game,
    window.start,
    window.end,
    normalized.limit || DEFAULT_LIMIT
  ).all();
  rows = result && Array.isArray(result.results) ? result.results : [];

  return {
    challenge: challenge,
    entries: rows.map(mapScoreRow)
  };
}

export async function getCurrentProfile(env, options) {
  var normalized = options || {};
  var database = requireDatabase(env);
  var playerId = normalizeText(normalized.playerId, 'playerId', 128);
  var fallbackPlayerName = normalizeOptionalText(normalized.playerName, 64) || 'Guest';
  var results = await Promise.all([
    database.prepare(PROFILE_BEST_GLOBAL_QUERY).bind(playerId).all(),
    database.prepare(PROFILE_BEST_PER_GAME_QUERY).bind(playerId).all(),
    database.prepare(PROFILE_RECENT_ACTIVITY_QUERY).bind(
      playerId,
      normalized.recentLimit || DEFAULT_PROFILE_RECENT_LIMIT
    ).all(),
    getCurrentChallenge(env)
  ]);
  var bestGlobalRows = results[0] && Array.isArray(results[0].results) ? results[0].results : [];
  var bestPerGameRows = results[1] && Array.isArray(results[1].results) ? results[1].results : [];
  var recentRows = results[2] && Array.isArray(results[2].results) ? results[2].results : [];
  var challenge = results[3];
  var bestGlobalEntry = mapScoreRow(bestGlobalRows[0] || null);
  var bestPerGame = bestPerGameRows.map(mapScoreRow);
  var recentEntries = recentRows.map(mapScoreRow);
  var resolvedPlayerName = recentEntries[0] && recentEntries[0].playerName
    ? recentEntries[0].playerName
    : (bestGlobalEntry && bestGlobalEntry.playerName ? bestGlobalEntry.playerName : fallbackPlayerName);
  var activeChallenge = {
    challenge: challenge,
    rank: null,
    totalPlayers: 0,
    entry: null
  };
  var challengeWindow;
  var challengeResult;
  var challengeRows;

  if (challenge) {
    challengeWindow = buildChallengeWindow(challenge.date);
    challengeResult = await database.prepare(PROFILE_ACTIVE_CHALLENGE_RANK_QUERY).bind(
      challenge.game,
      challengeWindow.start,
      challengeWindow.end,
      playerId
    ).all();
    challengeRows = challengeResult && Array.isArray(challengeResult.results)
      ? challengeResult.results
      : [];
    activeChallenge = Object.assign({
      challenge: challenge
    }, mapProfileChallengeEntry(challengeRows[0] || null));
  }

  return {
    player: {
      id: playerId,
      name: resolvedPlayerName
    },
    bestGlobalEntry: bestGlobalEntry,
    bestPerGame: bestPerGame,
    recentEntries: recentEntries,
    activeChallenge: activeChallenge
  };
}
