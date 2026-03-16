var GAME_ID_ALIASES = {
  'runner-3d': 'runner3d'
};

var DEFAULT_LIMIT = 10;
var MAX_LIMIT = 100;

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
  var query = [
    'SELECT id, game, player_id, player_name, score, score_type, created_at',
    'FROM scores'
  ];
  var statement;

  if (normalized.game) {
    query.push('WHERE game = ?1');
    query.push('ORDER BY score DESC, created_at DESC');
    query.push('LIMIT ?2');
    statement = database.prepare(query.join(' ')).bind(normalized.game, normalized.limit || DEFAULT_LIMIT);
  } else {
    query.push('ORDER BY score DESC, created_at DESC');
    query.push('LIMIT ?1');
    statement = database.prepare(query.join(' ')).bind(normalized.limit || DEFAULT_LIMIT);
  }

  var result = await statement.all();
  var rows = result && Array.isArray(result.results) ? result.results : [];

  return rows.map(mapScoreRow);
}
