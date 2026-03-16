(function (global) {
  'use strict';

  var SDK_VERSION = '1.2.0';
  var LANGUAGE_KEY = 'novarena_language';
  var PLAYER_KEY = 'novarena_guest_profile_v1';
  var SCORES_KEY = 'novarena_scores_v1';
  var LEADERBOARD_CACHE_KEY = 'novarena_leaderboard_cache_v1';
  var CURRENT_CHALLENGE_CACHE_KEY = 'novarena_current_challenge_cache_v1';
  var CHALLENGE_LEADERBOARD_CACHE_KEY = 'novarena_challenge_leaderboard_cache_v1';
  var CURRENT_PROFILE_CACHE_KEY = 'novarena_current_profile_cache_v1';
  var ACTIVITY_CACHE_KEY = 'novarena_activity_cache_v1';
  var GAME_ID_ALIASES = {
    'runner-3d': 'runner3d'
  };
  var GAME_CONTEXT_PATH_ALIASES = {
    runner3d: ['runner-3d']
  };
  var DEFAULT_REMOTE_TIMEOUT_MS = 5000;
  var DEFAULT_STORAGE_MODE = 'local';
  var DEFAULT_REMOTE_LIMIT = 10;
  var MAX_REMOTE_LIMIT = 100;
  var DEFAULT_PROFILE_RECENT_LIMIT = 6;
  var MAX_PROFILE_RECENT_LIMIT = 20;
  var PERIOD_ALL_TIME = 'all_time';
  var PERIOD_TODAY = 'today';
  var PERIOD_THIS_WEEK = 'this_week';
  var PERIOD_LATEST = 'latest';
  var DEFAULT_PLAYER_NAME_FALLBACK = 'Player';
  var NAME_PROMPT_COPY = {
    ca: {
      title: 'Introdueix el teu nom per guardar la puntuacio',
      label: 'Nom de jugador',
      placeholder: 'Escriu el teu nom',
      button: 'Guardar'
    },
    es: {
      title: 'Introduce tu nombre para guardar la puntuacion',
      label: 'Nombre de jugador',
      placeholder: 'Escribe tu nombre',
      button: 'Guardar'
    },
    en: {
      title: 'Enter your name to save your score',
      label: 'Player name',
      placeholder: 'Type your name',
      button: 'Save'
    },
    it: {
      title: 'Inserisci il tuo nome per salvare il punteggio',
      label: 'Nome giocatore',
      placeholder: 'Scrivi il tuo nome',
      button: 'Salva'
    }
  };
  var contextCache = {};
  var api = null;
  var runtimeConfig = null;
  var queuedUnnamedScores = [];
  var activeNamePrompt = null;

  function resolveLanguage(lang) {
    var value = String(lang || '').toLowerCase().split('-')[0];
    return ['ca', 'es', 'en', 'it'].indexOf(value) >= 0 ? value : 'en';
  }

  function normalizePeriod(period, fallbackPeriod) {
    var value = String(period || '').trim().toLowerCase();

    if (value === PERIOD_ALL_TIME || value === PERIOD_TODAY || value === PERIOD_THIS_WEEK || value === PERIOD_LATEST) {
      return value;
    }

    return fallbackPeriod || PERIOD_ALL_TIME;
  }

  function cloneObject(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeObjects(base, override) {
    var merged = {};
    var key;

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        merged[key] = base[key];
      }
    }

    for (key in override) {
      if (Object.prototype.hasOwnProperty.call(override, key)) {
        merged[key] = override[key];
      }
    }

    return merged;
  }

  function canonicalGameId(gameId) {
    if (!gameId) {
      return '';
    }

    var value = String(gameId);
    return GAME_ID_ALIASES[value] || value;
  }

  function normalizeStoredEntry(entry) {
    var score = Number(entry && entry.score);

    if (!entry || !entry.game || !Number.isFinite(score)) {
      return null;
    }

    return {
      game: canonicalGameId(entry.game),
      playerId: String(entry.playerId || ''),
      playerName: String(entry.playerName || DEFAULT_PLAYER_NAME_FALLBACK),
      score: score,
      scoreType: String(entry.scoreType || 'points'),
      createdAt: entry.createdAt || new Date().toISOString()
    };
  }

  function normalizeActivityItem(item) {
    var score = Number(item && item.score);

    if (!item || !item.game || !Number.isFinite(score)) {
      return null;
    }

    return {
      type: 'score',
      playerId: String(item.playerId || ''),
      playerName: String(item.playerName || DEFAULT_PLAYER_NAME_FALLBACK),
      game: canonicalGameId(item.game),
      score: score,
      createdAt: item.createdAt || new Date().toISOString()
    };
  }

  function normalizeActivityList(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map(normalizeActivityItem).filter(function (item) {
      return Boolean(item);
    });
  }

  function normalizeEntryList(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map(normalizeStoredEntry).filter(function (entry) {
      return Boolean(entry);
    });
  }

  function normalizeChallenge(challenge) {
    var targetValue = challenge && challenge.targetValue;
    var numericTarget = targetValue == null || targetValue === ''
      ? null
      : Number(targetValue);

    if (!challenge || typeof challenge !== 'object' || !challenge.id) {
      return null;
    }

    return {
      id: String(challenge.id),
      date: String(challenge.date || ''),
      game: canonicalGameId(challenge.game),
      title: String(challenge.title || ''),
      description: String(challenge.description || ''),
      metricType: String(challenge.metricType || 'score'),
      targetValue: Number.isFinite(numericTarget) ? numericTarget : null,
      isActive: Boolean(challenge.isActive),
      createdAt: challenge.createdAt || null
    };
  }

  function normalizeChallengeLeaderboardPayload(payload) {
    return {
      challenge: normalizeChallenge(payload && payload.challenge),
      entries: normalizeEntryList(payload && payload.entries)
    };
  }

  function normalizePlayerProfile(player) {
    if (!player || !player.id) {
      return null;
    }

    return {
      id: String(player.id),
      name: String(player.name || ''),
      type: String(player.type || 'guest'),
      source: String(player.source || 'local'),
      hasCustomName: player.hasCustomName === true
    };
  }

  function normalizeProfileChallenge(payload) {
    var rank = Number(payload && payload.rank);
    var totalPlayers = Number(payload && payload.totalPlayers);

    return {
      challenge: normalizeChallenge(payload && payload.challenge),
      rank: Number.isFinite(rank) && rank > 0 ? Math.floor(rank) : null,
      totalPlayers: Number.isFinite(totalPlayers) && totalPlayers > 0 ? Math.floor(totalPlayers) : 0,
      entry: normalizeStoredEntry(payload && payload.entry)
    };
  }

  function normalizeCurrentProfile(payload) {
    var player = normalizePlayerProfile(payload && payload.player);

    if (!player) {
      return null;
    }

    return {
      player: player,
      bestGlobalEntry: normalizeStoredEntry(payload && payload.bestGlobalEntry),
      bestPerGame: normalizeEntryList(payload && payload.bestPerGame),
      recentEntries: normalizeEntryList(payload && payload.recentEntries),
      activeChallenge: normalizeProfileChallenge(payload && payload.activeChallenge)
    };
  }

  function getGameContextCandidates(gameId) {
    var canonicalId = canonicalGameId(gameId);
    var aliases = GAME_CONTEXT_PATH_ALIASES[canonicalId] || [];

    return [canonicalId].concat(aliases.filter(function (alias) {
      return alias !== canonicalId;
    }));
  }

  function getSdkRoot() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i += 1) {
      var source = scripts[i].getAttribute('src') || '';
      var markerIndex = source.indexOf('assets/js/novarena-sdk.js');
      if (markerIndex >= 0) {
        return source.slice(0, markerIndex);
      }
    }
    return '';
  }

  function platformPath(relativePath) {
    return getSdkRoot() + relativePath;
  }

  function readJsonStorage(key, fallbackValue) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallbackValue;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore write failures in static mode.
    }
  }

  function buildGuestProfile() {
    var guestId = 'guest-' + Math.random().toString(16).slice(2, 10);
    return {
      id: guestId,
      name: '',
      type: 'guest',
      source: 'local',
      hasCustomName: false
    };
  }

  function normalizePlayerRecord(player) {
    var normalized = normalizePlayerProfile(player);
    var guestNamePattern;

    if (!normalized) {
      return null;
    }

    guestNamePattern = /^Guest [A-Z0-9]{4,}$/;

    if (typeof player.hasCustomName !== 'boolean') {
      normalized.hasCustomName = Boolean(normalized.name) && !guestNamePattern.test(normalized.name);
    }

    return normalized;
  }

  function playerHasExplicitName(player) {
    var normalized = normalizePlayerRecord(player);
    return Boolean(normalized && normalized.hasCustomName && normalized.name);
  }

  function playerDisplayName(player) {
    var normalized = normalizePlayerRecord(player);
    return normalized && normalized.name ? normalized.name : DEFAULT_PLAYER_NAME_FALLBACK;
  }

  function getPlayer() {
    var stored = normalizePlayerRecord(readJsonStorage(PLAYER_KEY, null));
    if (stored && stored.id) {
      writeJsonStorage(PLAYER_KEY, stored);
      return stored;
    }

    var guest = buildGuestProfile();
    writeJsonStorage(PLAYER_KEY, guest);
    return guest;
  }

  function getLanguage() {
    try {
      var saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved) {
        return resolveLanguage(saved);
      }
    } catch (error) {
      // Ignore localStorage failures.
    }

    if (document.documentElement && document.documentElement.lang) {
      return resolveLanguage(document.documentElement.lang);
    }

    return resolveLanguage(navigator.language || 'en');
  }

  function defaultStorageMode() {
    var hostname = global.location && global.location.hostname
      ? String(global.location.hostname).toLowerCase()
      : '';

    if (hostname === 'novarena.io' || hostname.slice(-12) === '.novarena.io') {
      return 'remote';
    }

    return DEFAULT_STORAGE_MODE;
  }

  function resolveStorageMode(mode) {
    return String(mode || '').toLowerCase() === 'remote' ? 'remote' : 'local';
  }

  function resolveApiBaseUrl(baseUrl) {
    var value = String(baseUrl || '/api').replace(/\/+$/, '');

    if (!value) {
      return '/api';
    }

    if (/^https?:\/\//i.test(value) || value.charAt(0) === '/') {
      return value;
    }

    return platformPath(value).replace(/\/+$/, '');
  }

  function buildRuntimeConfig(overrides) {
    var source = mergeObjects(global.NovarenaConfig || {}, overrides || {});
    var timeout = Number(source.remoteTimeoutMs);

    return {
      storageMode: resolveStorageMode(source.storageMode || defaultStorageMode()),
      apiBaseUrl: resolveApiBaseUrl(source.apiBaseUrl || '/api'),
      remoteFallback: source.remoteFallback !== false,
      remoteTimeoutMs: Number.isFinite(timeout) && timeout > 0
        ? Math.floor(timeout)
        : DEFAULT_REMOTE_TIMEOUT_MS
    };
  }

  runtimeConfig = buildRuntimeConfig();

  async function readJsonFile(relativePath) {
    var response = await fetch(platformPath(relativePath), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load ' + relativePath);
    }
    return response.json();
  }

  async function getGameContext(gameId) {
    var canonicalId = canonicalGameId(gameId);

    if (!canonicalId) {
      return null;
    }

    if (contextCache[canonicalId]) {
      return contextCache[canonicalId];
    }

    contextCache[canonicalId] = (async function () {
      var candidates = getGameContextCandidates(canonicalId);
      var i;

      for (i = 0; i < candidates.length; i += 1) {
        try {
          return await readJsonFile('games/' + candidates[i] + '/game.json');
        } catch (gameError) {
          // Try the next candidate path.
        }
      }

      try {
        var catalog = await readJsonFile('data/games.json');
        if (Array.isArray(catalog)) {
          var match = catalog.find(function (entry) {
            return entry && canonicalGameId(entry.id) === canonicalId;
          });
          if (match) {
            return match;
          }
        }
      } catch (catalogError) {
        // Ignore and fall back below.
      }

      return {
        id: canonicalId,
        title: canonicalId,
        path: 'games/' + candidates[0] + '/index.html'
      };
    })();

    return contextCache[canonicalId];
  }

  function normalizeScorePayload(payload) {
    var player = getPlayer();
    var score = Number(payload && payload.score);

    if (!payload || !payload.game) {
      throw new Error('Novarena.submitScore(scoreData) requires a game id.');
    }

    if (!Number.isFinite(score)) {
      throw new Error('Novarena.submitScore(scoreData) requires a numeric score.');
    }

    return normalizeStoredEntry({
      game: canonicalGameId(payload.game),
      playerId: String(payload.playerId || player.id),
      playerName: String(payload.playerName || playerDisplayName(player)),
      score: score,
      scoreType: String(payload.scoreType || 'points'),
      createdAt: payload.createdAt || new Date().toISOString()
    });
  }

  function readScoresLocal() {
    return normalizeEntryList(readJsonStorage(SCORES_KEY, []));
  }

  function writeScoresLocal(scores) {
    writeJsonStorage(SCORES_KEY, normalizeEntryList(scores));
  }

  function readLeaderboardCache() {
    var cache = readJsonStorage(LEADERBOARD_CACHE_KEY, {});

    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
      return {};
    }

    return cache;
  }

  function writeLeaderboardCache(cache) {
    writeJsonStorage(LEADERBOARD_CACHE_KEY, cache || {});
  }

  function readCurrentChallengeCache() {
    return normalizeChallenge(readJsonStorage(CURRENT_CHALLENGE_CACHE_KEY, null));
  }

  function writeCurrentChallengeCache(challenge) {
    writeJsonStorage(CURRENT_CHALLENGE_CACHE_KEY, normalizeChallenge(challenge));
  }

  function readChallengeLeaderboardCache() {
    var cache = readJsonStorage(CHALLENGE_LEADERBOARD_CACHE_KEY, {});

    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
      return {};
    }

    return cache;
  }

  function writeChallengeLeaderboardCache(cache) {
    writeJsonStorage(CHALLENGE_LEADERBOARD_CACHE_KEY, cache || {});
  }

  function readCurrentProfileCache() {
    var cache = readJsonStorage(CURRENT_PROFILE_CACHE_KEY, {});

    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
      return {};
    }

    return cache;
  }

  function writeCurrentProfileCache(cache) {
    writeJsonStorage(CURRENT_PROFILE_CACHE_KEY, cache || {});
  }

  function readActivityCache() {
    var cache = readJsonStorage(ACTIVITY_CACHE_KEY, {});

    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
      return {};
    }

    return cache;
  }

  function writeActivityCache(cache) {
    writeJsonStorage(ACTIVITY_CACHE_KEY, cache || {});
  }

  function normalizeLeaderboardOptions(options) {
    var normalized = {};

    if (typeof options === 'string') {
      normalized.game = options;
    } else {
      normalized = options || {};
    }

    var limit = Number(normalized.limit);
    return {
      game: normalized.game ? canonicalGameId(normalized.game) : null,
      limit: Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), MAX_REMOTE_LIMIT)
        : DEFAULT_REMOTE_LIMIT,
      order: normalized.order === 'asc' ? 'asc' : 'desc',
      period: normalizePeriod(normalized.period, PERIOD_ALL_TIME)
    };
  }

  function leaderboardCacheKey(options) {
    var normalized = normalizeLeaderboardOptions(options);
    return [
      normalized.game || 'global',
      normalized.limit,
      normalized.order,
      normalized.period
    ].join('|');
  }

  function challengeLeaderboardCacheKey(options) {
    var normalized = options || {};
    return [
      normalized.challengeId || 'current',
      normalized.limit || DEFAULT_REMOTE_LIMIT
    ].join('|');
  }

  function normalizeProfileOptions(options) {
    var normalized = options || {};
    var recentLimit = Number(normalized.recentLimit);

    return {
      recentLimit: Number.isFinite(recentLimit) && recentLimit > 0
        ? Math.min(Math.floor(recentLimit), MAX_PROFILE_RECENT_LIMIT)
        : DEFAULT_PROFILE_RECENT_LIMIT
    };
  }

  function normalizeActivityOptions(options) {
    var normalized = options || {};
    var limit = Number(normalized.limit);

    return {
      game: normalized.game ? canonicalGameId(normalized.game) : null,
      limit: Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), MAX_REMOTE_LIMIT)
        : DEFAULT_REMOTE_LIMIT,
      period: normalizePeriod(normalized.period, PERIOD_LATEST)
    };
  }

  function currentProfileCacheKey(player, options) {
    var normalizedPlayer = normalizePlayerProfile(player) || getPlayer();
    var normalizedOptions = normalizeProfileOptions(options);

    return [
      normalizedPlayer.id,
      normalizedOptions.recentLimit
    ].join('|');
  }

  function activityCacheKey(options) {
    var normalized = normalizeActivityOptions(options);

    return [
      normalized.game || 'all',
      normalized.limit,
      normalized.period
    ].join('|');
  }

  function getCachedLeaderboard(options) {
    var cache = readLeaderboardCache();
    var entries = cache[leaderboardCacheKey(options)];

    return Array.isArray(entries) ? normalizeEntryList(entries) : null;
  }

  function setCachedLeaderboard(options, entries) {
    var cache = readLeaderboardCache();
    cache[leaderboardCacheKey(options)] = normalizeEntryList(entries);
    writeLeaderboardCache(cache);
  }

  function getCachedChallengeLeaderboard(options) {
    var cache = readChallengeLeaderboardCache();
    var result = cache[challengeLeaderboardCacheKey(options)];

    if (!result || typeof result !== 'object') {
      return null;
    }

    return normalizeChallengeLeaderboardPayload(result);
  }

  function setCachedChallengeLeaderboard(options, payload) {
    var cache = readChallengeLeaderboardCache();
    cache[challengeLeaderboardCacheKey(options)] = normalizeChallengeLeaderboardPayload(payload);
    writeChallengeLeaderboardCache(cache);
  }

  function getCachedCurrentProfile(player, options) {
    var cache = readCurrentProfileCache();
    var payload = cache[currentProfileCacheKey(player, options)];

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    return normalizeCurrentProfile(payload);
  }

  function setCachedCurrentProfile(player, options, payload) {
    var cache = readCurrentProfileCache();
    cache[currentProfileCacheKey(player, options)] = normalizeCurrentProfile(payload);
    writeCurrentProfileCache(cache);
  }

  function getCachedActivity(options) {
    var cache = readActivityCache();
    var items = cache[activityCacheKey(options)];

    return Array.isArray(items) ? normalizeActivityList(items) : null;
  }

  function setCachedActivity(options, items) {
    var cache = readActivityCache();
    cache[activityCacheKey(options)] = normalizeActivityList(items);
    writeActivityCache(cache);
  }

  function getFallbackChallenge(options) {
    var challenge = readCurrentChallengeCache();
    var normalized = options || {};

    if (!challenge) {
      return null;
    }

    if (normalized.challengeId && challenge.id !== normalized.challengeId) {
      return null;
    }

    return challenge;
  }

  function sortScores(scores, order) {
    return scores.slice().sort(function (left, right) {
      if (left.score !== right.score) {
        return order === 'asc' ? left.score - right.score : right.score - left.score;
      }

      return order === 'asc'
        ? String(left.createdAt).localeCompare(String(right.createdAt))
        : String(right.createdAt).localeCompare(String(left.createdAt));
    });
  }

  function dedupeBestScores(scores, order) {
    var normalizedOrder = order === 'asc' ? 'asc' : 'desc';
    var bestByPlayer = {};

    sortScores(normalizeEntryList(scores), normalizedOrder).forEach(function (entry) {
      if (!entry.playerId) {
        return;
      }

      if (!bestByPlayer[entry.playerId]) {
        bestByPlayer[entry.playerId] = entry;
      }
    });

    return Object.keys(bestByPlayer).map(function (playerId) {
      return cloneObject(bestByPlayer[playerId]);
    });
  }

  function dedupeBestScoresByGame(scores) {
    var bestByGame = {};

    sortScores(normalizeEntryList(scores), 'desc').forEach(function (entry) {
      var gameId = canonicalGameId(entry.game);

      if (!gameId || bestByGame[gameId]) {
        return;
      }

      bestByGame[gameId] = cloneObject(entry);
    });

    return sortScores(Object.keys(bestByGame).map(function (gameId) {
      return bestByGame[gameId];
    }), 'desc');
  }

  function buildLeaderboard(scores, options) {
    var normalized = normalizeLeaderboardOptions(options);
    var filtered = filterEntriesByPeriod(scores, normalized.period).filter(function (entry) {
      return !normalized.game || canonicalGameId(entry.game) === normalized.game;
    });

    return sortScores(dedupeBestScores(filtered, normalized.order), normalized.order).slice(0, normalized.limit).map(function (entry) {
      return cloneObject(entry);
    });
  }

  function buildChallengeWindow(dateValue) {
    var start = new Date(String(dateValue) + 'T00:00:00.000Z');
    var end;

    if (Number.isNaN(start.getTime())) {
      return null;
    }

    end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  function buildChallengeLeaderboard(scores, challenge, limit) {
    var normalizedChallenge = normalizeChallenge(challenge);
    var window = normalizedChallenge ? buildChallengeWindow(normalizedChallenge.date) : null;

    if (!normalizedChallenge || !window) {
      return {
        challenge: normalizedChallenge,
        entries: []
      };
    }

    return {
      challenge: normalizedChallenge,
      entries: sortScores(dedupeBestScores(normalizeEntryList(scores).filter(function (entry) {
        var createdAt = String(entry.createdAt || '');
        return canonicalGameId(entry.game) === normalizedChallenge.game
          && createdAt >= window.start
          && createdAt < window.end;
      }), 'desc'), 'desc').slice(0, limit || DEFAULT_REMOTE_LIMIT).map(function (entry) {
        return cloneObject(entry);
      })
    };
  }

  function buildChallengeEntries(scores, challenge) {
    var normalizedChallenge = normalizeChallenge(challenge);
    var window = normalizedChallenge ? buildChallengeWindow(normalizedChallenge.date) : null;

    if (!normalizedChallenge || !window) {
      return [];
    }

    return sortScores(dedupeBestScores(normalizeEntryList(scores).filter(function (entry) {
      var createdAt = String(entry.createdAt || '');
      return canonicalGameId(entry.game) === normalizedChallenge.game
        && createdAt >= window.start
        && createdAt < window.end;
    }), 'desc'), 'desc').map(function (entry) {
      return cloneObject(entry);
    });
  }

  function startOfUtcDay(date) {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0, 0, 0, 0
    ));
  }

  function startOfUtcWeek(date) {
    var start = startOfUtcDay(date);
    var day = start.getUTCDay();
    var diff = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + diff);
    return start;
  }

  function periodStart(period) {
    var now = new Date();

    if (period === PERIOD_TODAY) {
      return startOfUtcDay(now).toISOString();
    }

    if (period === PERIOD_THIS_WEEK) {
      return startOfUtcWeek(now).toISOString();
    }

    return null;
  }

  function filterEntriesByPeriod(entries, period) {
    var start = periodStart(period);

    if (!start || period === PERIOD_ALL_TIME || period === PERIOD_LATEST) {
      return normalizeEntryList(entries);
    }

    return normalizeEntryList(entries).filter(function (entry) {
      return String(entry.createdAt || '') >= start;
    });
  }

  function sortRecentScores(scores) {
    return normalizeEntryList(scores).slice().sort(function (left, right) {
      var leftDate = String(left.createdAt || '');
      var rightDate = String(right.createdAt || '');

      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate);
      }

      return right.score - left.score;
    });
  }

  function buildActivity(scores, options) {
    var normalized = normalizeActivityOptions(options);

    return filterEntriesByPeriod(scores, normalized.period).filter(function (entry) {
      return !normalized.game || canonicalGameId(entry.game) === normalized.game;
    }).sort(function (left, right) {
      var leftDate = String(left.createdAt || '');
      var rightDate = String(right.createdAt || '');

      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate);
      }

      return right.score - left.score;
    }).slice(0, normalized.limit).map(function (entry) {
      return normalizeActivityItem(entry);
    }).filter(function (item) {
      return Boolean(item);
    });
  }

  function buildCurrentProfileFromScores(scores, player, challenge, options) {
    var normalizedPlayer = normalizePlayerProfile(player) || getPlayer();
    var normalizedOptions = normalizeProfileOptions(options);
    var playerScores = normalizeEntryList(scores).filter(function (entry) {
      return entry.playerId === normalizedPlayer.id;
    });
    var bestGlobalEntry = sortScores(playerScores, 'desc')[0] || null;
    var challengeEntries = buildChallengeEntries(scores, challenge);
    var challengeIndex = challengeEntries.findIndex(function (entry) {
      return entry.playerId === normalizedPlayer.id;
    });
    var challengeEntry = challengeIndex >= 0 ? challengeEntries[challengeIndex] : null;

    return normalizeCurrentProfile({
      player: normalizedPlayer,
      bestGlobalEntry: bestGlobalEntry,
      bestPerGame: dedupeBestScoresByGame(playerScores),
      recentEntries: sortRecentScores(playerScores).slice(0, normalizedOptions.recentLimit),
      activeChallenge: {
        challenge: normalizeChallenge(challenge),
        rank: challengeIndex >= 0 ? challengeIndex + 1 : null,
        totalPlayers: challengeEntries.length,
        entry: challengeEntry
      }
    });
  }

  function namePromptCopy() {
    return NAME_PROMPT_COPY[getLanguage()] || NAME_PROMPT_COPY.en;
  }

  function clearCurrentProfileCache() {
    writeCurrentProfileCache({});
  }

  function clearActivityCache() {
    writeActivityCache({});
  }

  function setPlayerRecord(player) {
    var normalized = normalizePlayerRecord(player);

    if (!normalized) {
      return getPlayer();
    }

    writeJsonStorage(PLAYER_KEY, normalized);
    clearCurrentProfileCache();
    return normalized;
  }

  function setPlayerName(name) {
    var trimmed = String(name == null ? '' : name).trim();
    var current = getPlayer();
    var updated;

    if (!trimmed) {
      throw new Error('Novarena.setPlayerName(name) requires a non-empty name.');
    }

    updated = setPlayerRecord({
      id: current.id,
      name: trimmed.slice(0, 64),
      type: current.type,
      source: current.source,
      hasCustomName: true
    });

    if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
      global.dispatchEvent(new global.CustomEvent('novarena:player-updated', {
        detail: cloneObject(updated)
      }));
    }

    return cloneObject(updated);
  }

  function ensureNamePromptStyles() {
    if (document.getElementById('novarena-name-prompt-style')) {
      return;
    }

    var style = document.createElement('style');
    style.id = 'novarena-name-prompt-style';
    style.textContent = [
      '.novarena-name-prompt-backdrop{position:fixed;inset:0;background:rgba(3,8,20,.82);display:flex;align-items:center;justify-content:center;padding:24px;z-index:9999;}',
      '.novarena-name-prompt{width:min(420px,100%);background:#0c1322;border:1px solid rgba(104,216,255,.22);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,.45);padding:24px;color:#edf5ff;font-family:inherit;}',
      '.novarena-name-prompt h2{margin:0 0 10px;font-size:22px;line-height:1.2;}',
      '.novarena-name-prompt p,.novarena-name-prompt label{color:#9db2c9;line-height:1.6;font-size:14px;}',
      '.novarena-name-prompt input{width:100%;margin-top:8px;padding:14px 16px;border-radius:14px;border:1px solid rgba(104,216,255,.26);background:#08111f;color:#edf5ff;font:inherit;}',
      '.novarena-name-prompt button{margin-top:16px;width:100%;padding:14px 18px;border:none;border-radius:999px;background:linear-gradient(135deg,#0ea5e9,#7c3aed);color:#fff;font:inherit;font-weight:700;cursor:pointer;}',
      '.novarena-name-prompt small{display:block;margin-top:10px;color:#6f869f;}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeActiveNamePrompt() {
    if (!activeNamePrompt) {
      return;
    }

    if (activeNamePrompt.backdrop && activeNamePrompt.backdrop.parentNode) {
      activeNamePrompt.backdrop.parentNode.removeChild(activeNamePrompt.backdrop);
    }

    activeNamePrompt = null;
  }

  function promptForPlayerName() {
    if (activeNamePrompt && activeNamePrompt.promise) {
      return activeNamePrompt.promise;
    }

    if (!document || !document.body) {
      return Promise.reject(new Error('Document body is not available for the player-name prompt.'));
    }

    ensureNamePromptStyles();

    var copy = namePromptCopy();
    var player = getPlayer();
    var backdrop = document.createElement('div');
    var dialog = document.createElement('form');
    var label = document.createElement('label');
    var input = document.createElement('input');
    var button = document.createElement('button');
    var hint = document.createElement('small');
    var title = document.createElement('h2');
    var promise = new Promise(function (resolve) {
      backdrop.className = 'novarena-name-prompt-backdrop';
      dialog.className = 'novarena-name-prompt';
      title.textContent = copy.title;
      label.textContent = copy.label;
      input.type = 'text';
      input.name = 'playerName';
      input.maxLength = 64;
      input.autocomplete = 'nickname';
      input.placeholder = copy.placeholder;
      input.value = player.hasCustomName ? player.name : '';
      button.type = 'submit';
      button.textContent = copy.button;
      hint.textContent = player.id;

      label.appendChild(input);
      dialog.appendChild(title);
      dialog.appendChild(label);
      dialog.appendChild(button);
      dialog.appendChild(hint);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
      global.setTimeout(function () {
        input.focus();
        input.select();
      }, 0);

      dialog.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!String(input.value || '').trim()) {
          input.focus();
          return;
        }

        resolve(setPlayerName(input.value));
        closeActiveNamePrompt();
      });
    });

    activeNamePrompt = {
      backdrop: backdrop,
      promise: promise
    };

    return promise;
  }

  function flushQueuedUnnamedScores(provider) {
    var player = getPlayer();
    var entries = queuedUnnamedScores.splice(0, queuedUnnamedScores.length).map(function (entry) {
      return normalizeStoredEntry({
        game: entry.game,
        playerId: player.id,
        playerName: playerDisplayName(player),
        score: entry.score,
        scoreType: entry.scoreType,
        createdAt: entry.createdAt
      });
    });

    entries.forEach(function (entry) {
      provider.submitScore(entry);
    });
  }

  function buildApiUrl(path, query) {
    var baseUrl = runtimeConfig.apiBaseUrl || '/api';
    var normalizedPath = String(path || '').replace(/^\/+/, '');
    var url = baseUrl + '/' + normalizedPath;
    var params = new URLSearchParams();
    var key;

    if (query) {
      for (key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key) && query[key] != null && query[key] !== '') {
          params.set(key, String(query[key]));
        }
      }
    }

    if (params.toString()) {
      url += '?' + params.toString();
    }

    return url;
  }

  async function requestJson(method, path, options) {
    var requestOptions = options || {};
    var headers = {
      Accept: 'application/json'
    };
    var controller = typeof global.AbortController === 'function'
      ? new global.AbortController()
      : null;
    var timeoutId = null;
    var response;

    if (requestOptions.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (controller && runtimeConfig.remoteTimeoutMs > 0) {
      timeoutId = global.setTimeout(function () {
        controller.abort();
      }, runtimeConfig.remoteTimeoutMs);
    }

    try {
      response = await fetch(buildApiUrl(path, requestOptions.query), {
        method: method,
        headers: headers,
        body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined,
        signal: controller ? controller.signal : undefined
      });
    } finally {
      if (timeoutId) {
        global.clearTimeout(timeoutId);
      }
    }

    if (!response.ok) {
      var payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      throw new Error(payload && payload.error
        ? payload.error
        : 'Remote request failed with status ' + response.status + '.');
    }

    return response.json();
  }

  function createLocalStorageProvider() {
    return {
      submitScore: function (entry) {
        var scores = readScoresLocal();
        scores.push(entry);
        writeScoresLocal(scores);
        clearActivityCache();
        clearCurrentProfileCache();
        return cloneObject(entry);
      },

      getScores: function () {
        return readScoresLocal().map(function (entry) {
          return cloneObject(entry);
        });
      },

      getLeaderboard: function (options) {
        return buildLeaderboard(readScoresLocal(), options);
      },

      getLeaderboardAsync: function (options) {
        return Promise.resolve(buildLeaderboard(readScoresLocal(), options));
      },

      getActivity: function (options) {
        return buildActivity(readScoresLocal(), options);
      },

      getActivityAsync: function (options) {
        return Promise.resolve(buildActivity(readScoresLocal(), options));
      },

      getCurrentChallenge: function () {
        return null;
      },

      getCurrentChallengeAsync: function () {
        return Promise.resolve(null);
      },

      getChallengeLeaderboard: function () {
        return {
          challenge: null,
          entries: []
        };
      },

      getChallengeLeaderboardAsync: function () {
        return Promise.resolve({
          challenge: null,
          entries: []
        });
      },

      getCurrentProfile: function (options) {
        return buildCurrentProfileFromScores(
          readScoresLocal(),
          getPlayer(),
          readCurrentChallengeCache(),
          options
        );
      },

      getCurrentProfileAsync: function (options) {
        return Promise.resolve(buildCurrentProfileFromScores(
          readScoresLocal(),
          getPlayer(),
          readCurrentChallengeCache(),
          options
        ));
      }
    };
  }

  function createCloudflareAPIProvider(localProvider) {
    return {
      submitScore: function (entry) {
        var savedEntry = localProvider.submitScore(entry);

        requestJson('POST', 'score', { body: entry }).catch(function () {
          // Keep local fallback only if remote is unavailable.
        });

        return savedEntry;
      },

      getScores: function () {
        return localProvider.getScores();
      },

      getLeaderboard: function (options) {
        var cached = getCachedLeaderboard(options);

        if (cached) {
          return cached;
        }

        return runtimeConfig.remoteFallback
          ? localProvider.getLeaderboard(options)
          : [];
      },

      getLeaderboardAsync: function (options) {
        var normalized = normalizeLeaderboardOptions(options);
        var query = {
          limit: normalized.limit,
          period: normalized.period
        };

        if (normalized.game) {
          query.game = normalized.game;
        }

        return requestJson('GET', 'leaderboard', { query: query }).then(function (payload) {
          var entries = normalizeEntryList(payload && payload.entries);
          setCachedLeaderboard(normalized, entries);
          return entries;
        }).catch(function () {
          var cached = getCachedLeaderboard(normalized);

          if (cached) {
            return cached;
          }

          return runtimeConfig.remoteFallback
            ? localProvider.getLeaderboard(normalized)
            : [];
        });
      },

      getActivity: function (options) {
        var cached = getCachedActivity(options);

        if (cached) {
          return cached;
        }

        return runtimeConfig.remoteFallback
          ? localProvider.getActivity(options)
          : [];
      },

      getActivityAsync: function (options) {
        var normalized = normalizeActivityOptions(options);
        var query = {
          limit: normalized.limit,
          period: normalized.period
        };

        if (normalized.game) {
          query.game = normalized.game;
        }

        return requestJson('GET', 'activity', { query: query }).then(function (payload) {
          var items = normalizeActivityList(payload && payload.items);
          setCachedActivity(normalized, items);
          return items;
        }).catch(function () {
          var cached = getCachedActivity(normalized);

          if (cached) {
            return cached;
          }

          return runtimeConfig.remoteFallback
            ? localProvider.getActivity(normalized)
            : [];
        });
      },

      getCurrentChallenge: function () {
        return readCurrentChallengeCache();
      },

      getCurrentChallengeAsync: function () {
        return requestJson('GET', 'challenge/current').then(function (payload) {
          var challenge = normalizeChallenge(payload && payload.challenge);
          writeCurrentChallengeCache(challenge);
          return challenge;
        }).catch(function () {
          return readCurrentChallengeCache();
        });
      },

      getChallengeLeaderboard: function (options) {
        var normalized = options || {};
        var cached = getCachedChallengeLeaderboard(normalized);
        var challenge = cached && cached.challenge ? cached.challenge : getFallbackChallenge(normalized);

        if (cached) {
          return cached;
        }

        if (runtimeConfig.remoteFallback && challenge) {
          return buildChallengeLeaderboard(readScoresLocal(), challenge, normalized.limit);
        }

        return {
          challenge: challenge,
          entries: []
        };
      },

      getChallengeLeaderboardAsync: function (options) {
        var normalized = options || {};
        var query = {
          limit: normalized.limit || DEFAULT_REMOTE_LIMIT
        };

        if (normalized.challengeId) {
          query.challengeId = normalized.challengeId;
        }

        return requestJson('GET', 'challenge/leaderboard', { query: query }).then(function (payload) {
          var result = normalizeChallengeLeaderboardPayload(payload);
          setCachedChallengeLeaderboard(normalized, result);
          writeCurrentChallengeCache(result.challenge);
          return result;
        }).catch(function () {
          var cached = getCachedChallengeLeaderboard(normalized);
          var challenge = cached && cached.challenge ? cached.challenge : getFallbackChallenge(normalized);

          if (cached) {
            return cached;
          }

          if (runtimeConfig.remoteFallback && challenge) {
            return buildChallengeLeaderboard(readScoresLocal(), challenge, normalized.limit);
          }

          return {
            challenge: challenge,
            entries: []
          };
        });
      },

      getCurrentProfile: function (options) {
        var player = getPlayer();
        var cached = getCachedCurrentProfile(player, options);

        if (cached) {
          return cached;
        }

        return runtimeConfig.remoteFallback
          ? buildCurrentProfileFromScores(readScoresLocal(), player, readCurrentChallengeCache(), options)
          : normalizeCurrentProfile({
            player: player,
            bestGlobalEntry: null,
            bestPerGame: [],
            recentEntries: [],
            activeChallenge: {
              challenge: readCurrentChallengeCache(),
              rank: null,
              totalPlayers: 0,
              entry: null
            }
          });
      },

      getCurrentProfileAsync: function (options) {
        var player = getPlayer();
        var normalized = normalizeProfileOptions(options);

        return requestJson('GET', 'profile/current', {
          query: {
            playerId: player.id,
            playerName: playerDisplayName(player),
            recentLimit: normalized.recentLimit
          }
        }).then(function (payload) {
          var profile = normalizeCurrentProfile(payload && payload.profile);

          if (profile && profile.activeChallenge && profile.activeChallenge.challenge) {
            writeCurrentChallengeCache(profile.activeChallenge.challenge);
          }

          setCachedCurrentProfile(player, normalized, profile);
          return profile;
        }).catch(function () {
          var cached = getCachedCurrentProfile(player, normalized);

          if (cached) {
            return cached;
          }

          return runtimeConfig.remoteFallback
            ? buildCurrentProfileFromScores(readScoresLocal(), player, readCurrentChallengeCache(), normalized)
            : normalizeCurrentProfile({
              player: player,
              bestGlobalEntry: null,
              bestPerGame: [],
              recentEntries: [],
              activeChallenge: {
                challenge: readCurrentChallengeCache(),
                rank: null,
                totalPlayers: 0,
                entry: null
              }
            });
        });
      }
    };
  }

  var localProvider = createLocalStorageProvider();
  var providers = {
    local: localProvider,
    remote: createCloudflareAPIProvider(localProvider)
  };

  function getProvider() {
    return api && api.storageMode === 'remote' ? providers.remote : providers.local;
  }

  function submitScore(scoreData) {
    var entry = normalizeScorePayload(scoreData);
    var provider = getProvider();

    if (!playerHasExplicitName(getPlayer())) {
      queuedUnnamedScores.push(entry);
      promptForPlayerName().then(function () {
        flushQueuedUnnamedScores(provider);
      }).catch(function () {
        queuedUnnamedScores.length = 0;
      });
      return cloneObject(entry);
    }

    return provider.submitScore(entry);
  }

  function getLeaderboard(options) {
    return getProvider().getLeaderboard(normalizeLeaderboardOptions(options));
  }

  function getLeaderboardAsync(options) {
    var normalized = normalizeLeaderboardOptions(options);
    var provider = getProvider();

    if (typeof provider.getLeaderboardAsync === 'function') {
      return provider.getLeaderboardAsync(normalized);
    }

    return Promise.resolve(provider.getLeaderboard(normalized));
  }

  function getActivity(options) {
    var provider = getProvider();
    var normalized = normalizeActivityOptions(options);

    if (typeof provider.getActivity === 'function') {
      return provider.getActivity(normalized);
    }

    return [];
  }

  function getActivityAsync(options) {
    var provider = getProvider();
    var normalized = normalizeActivityOptions(options);

    if (typeof provider.getActivityAsync === 'function') {
      return provider.getActivityAsync(normalized);
    }

    return Promise.resolve(getActivity(normalized));
  }

  function normalizeChallengeLeaderboardOptions(options) {
    var normalized = options || {};
    var limit = Number(normalized.limit);

    return {
      challengeId: normalized.challengeId ? String(normalized.challengeId) : null,
      limit: Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), MAX_REMOTE_LIMIT)
        : DEFAULT_REMOTE_LIMIT
    };
  }

  function getCurrentChallenge() {
    var provider = getProvider();

    if (typeof provider.getCurrentChallenge === 'function') {
      return provider.getCurrentChallenge();
    }

    return null;
  }

  function getCurrentChallengeAsync() {
    var provider = getProvider();

    if (typeof provider.getCurrentChallengeAsync === 'function') {
      return provider.getCurrentChallengeAsync();
    }

    return Promise.resolve(getCurrentChallenge());
  }

  function getChallengeLeaderboard(options) {
    var provider = getProvider();
    var normalized = normalizeChallengeLeaderboardOptions(options);

    if (typeof provider.getChallengeLeaderboard === 'function') {
      return provider.getChallengeLeaderboard(normalized);
    }

    return {
      challenge: null,
      entries: []
    };
  }

  function getChallengeLeaderboardAsync(options) {
    var provider = getProvider();
    var normalized = normalizeChallengeLeaderboardOptions(options);

    if (typeof provider.getChallengeLeaderboardAsync === 'function') {
      return provider.getChallengeLeaderboardAsync(normalized);
    }

    return Promise.resolve(getChallengeLeaderboard(normalized));
  }

  function getCurrentProfile(options) {
    var provider = getProvider();
    var normalized = normalizeProfileOptions(options);

    if (typeof provider.getCurrentProfile === 'function') {
      return provider.getCurrentProfile(normalized);
    }

    return normalizeCurrentProfile({
      player: getPlayer(),
      bestGlobalEntry: null,
      bestPerGame: [],
      recentEntries: [],
      activeChallenge: {
        challenge: null,
        rank: null,
        totalPlayers: 0,
        entry: null
      }
    });
  }

  function getCurrentProfileAsync(options) {
    var provider = getProvider();
    var normalized = normalizeProfileOptions(options);

    if (typeof provider.getCurrentProfileAsync === 'function') {
      return provider.getCurrentProfileAsync(normalized);
    }

    return Promise.resolve(getCurrentProfile(normalized));
  }

  function getScoresLocal() {
    return readScoresLocal().map(function (entry) {
      return cloneObject(entry);
    });
  }

  function configure(overrides) {
    runtimeConfig = buildRuntimeConfig(mergeObjects(runtimeConfig || {}, overrides || {}));
    api.storageMode = runtimeConfig.storageMode;
    return cloneObject(runtimeConfig);
  }

  function getConfig() {
    return cloneObject(runtimeConfig);
  }

  api = {
    version: SDK_VERSION,
    storageMode: runtimeConfig.storageMode,
    configure: configure,
    getConfig: getConfig,
    setPlayerName: setPlayerName,
    submitScore: submitScore,
    getLeaderboard: getLeaderboard,
    getLeaderboardAsync: getLeaderboardAsync,
    getActivity: getActivity,
    getActivityAsync: getActivityAsync,
    getCurrentChallenge: getCurrentChallenge,
    getCurrentChallengeAsync: getCurrentChallengeAsync,
    getChallengeLeaderboard: getChallengeLeaderboard,
    getChallengeLeaderboardAsync: getChallengeLeaderboardAsync,
    getCurrentProfile: getCurrentProfile,
    getCurrentProfileAsync: getCurrentProfileAsync,
    getPlayer: getPlayer,
    getScoresLocal: getScoresLocal,
    getLanguage: getLanguage,
    getGameContext: getGameContext
  };

  global.Novarena = api;
})(window);
