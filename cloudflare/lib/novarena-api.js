var GAME_ID_ALIASES = {
  'runner-3d': 'runner3d'
};

var DEFAULT_LIMIT = 10;
var MAX_LIMIT = 100;
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
  'FROM scores',
  'WHERE game = ?1',
  'AND created_at >= ?2',
  'AND created_at < ?3',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?4'
].join(' ');
var GAME_LEADERBOARD_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM scores',
  'WHERE game = ?1',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?2'
].join(' ');
var GLOBAL_LEADERBOARD_QUERY = [
  'SELECT id, game, player_id, player_name, score, score_type, created_at',
  'FROM scores',
  'ORDER BY score DESC, created_at DESC',
  'LIMIT ?1'
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

function requireDatabase(env) {
  if (!env || !env.NOVARENA_DB) {
    throw new HttpError(500, 'NOVARENA_DB binding is not configured');
  }

  return env.NOVARENA_DB;
}

function mapScoreRow(row) {
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
