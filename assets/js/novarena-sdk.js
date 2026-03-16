(function (global) {
  'use strict';

  var SDK_VERSION = '1.1.0';
  var LANGUAGE_KEY = 'novarena_language';
  var PLAYER_KEY = 'novarena_guest_profile_v1';
  var SCORES_KEY = 'novarena_scores_v1';
  var GAME_ID_ALIASES = {
    'runner-3d': 'runner3d'
  };
  var GAME_CONTEXT_PATH_ALIASES = {
    runner3d: ['runner-3d']
  };
  var contextCache = {};
  var api = null;

  function resolveLanguage(lang) {
    var value = String(lang || '').toLowerCase().split('-')[0];
    return ['ca', 'es', 'en', 'it'].indexOf(value) >= 0 ? value : 'en';
  }

  function cloneObject(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonicalGameId(gameId) {
    if (!gameId) {
      return '';
    }

    var value = String(gameId);
    return GAME_ID_ALIASES[value] || value;
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

    return {
      game: canonicalGameId(payload.game),
      playerId: String(payload.playerId || player.id),
      playerName: String(payload.playerName || player.name),
      score: score,
      scoreType: String(payload.scoreType || 'points'),
      createdAt: payload.createdAt || new Date().toISOString()
    };
  }

  function readScoresLocal() {
    var scores = readJsonStorage(SCORES_KEY, []);
    return Array.isArray(scores) ? scores : [];
  }

  function writeScoresLocal(scores) {
    writeJsonStorage(SCORES_KEY, scores);
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
      limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10,
      order: normalized.order === 'asc' ? 'asc' : 'desc'
    };
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
    var filtered = scores.filter(function (entry) {
      return !normalized.game || canonicalGameId(entry.game) === normalized.game;
    });

    return sortScores(filtered, normalized.order).slice(0, normalized.limit).map(function (entry) {
      var cloned = cloneObject(entry);
      cloned.game = canonicalGameId(cloned.game);
      return cloned;
    });
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
      }
    };
  }

  function createCloudflareAPIProvider() {
    return {
      submitScore: function () {
        // Future integration point for Cloudflare Workers / Pages Functions:
        // POST /api/score
        throw new Error('CloudflareAPIProvider is not implemented yet.');
      },

      getScores: function () {
        // Future integration point for remote readbacks.
        // GET /api/leaderboard
        throw new Error('CloudflareAPIProvider is not implemented yet.');
      },

      getLeaderboard: function () {
        // Future integration point for remote leaderboards.
        // GET /api/leaderboard?game=snake&limit=10&order=desc
        throw new Error('CloudflareAPIProvider is not implemented yet.');
      }
    };
  }

  var providers = {
    local: createLocalStorageProvider(),
    remote: createCloudflareAPIProvider()
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

  function getScoresLocal() {
    return readScoresLocal().map(function (entry) {
      var cloned = cloneObject(entry);
      cloned.game = canonicalGameId(cloned.game);
      return cloned;
    });
  }

  api = {
    version: SDK_VERSION,
    storageMode: 'local',
    submitScore: submitScore,
    getLeaderboard: getLeaderboard,
    getPlayer: getPlayer,
    getScoresLocal: getScoresLocal,
    getLanguage: getLanguage,
    getGameContext: getGameContext
  };

  global.Novarena = api;
})(window);
