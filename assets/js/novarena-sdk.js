(function (global) {
  'use strict';

  var SDK_VERSION = '1.2.0';
  var LANGUAGE_KEY = 'novarena_language';
  var PLAYER_KEY = 'novarena_guest_profile_v1';
  var SCORES_KEY = 'novarena_scores_v1';
  var LEADERBOARD_CACHE_KEY = 'novarena_leaderboard_cache_v1';
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
  var contextCache = {};
  var api = null;
  var runtimeConfig = null;

  function resolveLanguage(lang) {
    var value = String(lang || '').toLowerCase().split('-')[0];
    return ['ca', 'es', 'en', 'it'].indexOf(value) >= 0 ? value : 'en';
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
      playerName: String(entry.playerName || 'Player'),
      score: score,
      scoreType: String(entry.scoreType || 'points'),
      createdAt: entry.createdAt || new Date().toISOString()
    };
  }

  function normalizeEntryList(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map(normalizeStoredEntry).filter(function (entry) {
      return Boolean(entry);
    });
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
      name: 'Guest ' + guestId.slice(-4).toUpperCase(),
      type: 'guest',
      source: 'local'
    };
  }

  function getPlayer() {
    var stored = readJsonStorage(PLAYER_KEY, null);
    if (stored && stored.id && stored.name) {
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
      playerName: String(payload.playerName || player.name),
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
      order: normalized.order === 'asc' ? 'asc' : 'desc'
    };
  }

  function leaderboardCacheKey(options) {
    var normalized = normalizeLeaderboardOptions(options);
    return [
      normalized.game || 'global',
      normalized.limit,
      normalized.order
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

  function buildLeaderboard(scores, options) {
    var normalized = normalizeLeaderboardOptions(options);
    var filtered = normalizeEntryList(scores).filter(function (entry) {
      return !normalized.game || canonicalGameId(entry.game) === normalized.game;
    });

    return sortScores(filtered, normalized.order).slice(0, normalized.limit).map(function (entry) {
      return cloneObject(entry);
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
          limit: normalized.limit
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
    return getProvider().submitScore(entry);
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
    submitScore: submitScore,
    getLeaderboard: getLeaderboard,
    getLeaderboardAsync: getLeaderboardAsync,
    getPlayer: getPlayer,
    getScoresLocal: getScoresLocal,
    getLanguage: getLanguage,
    getGameContext: getGameContext
  };

  global.Novarena = api;
})(window);
