(function (global) {
  'use strict';

  var SDK_VERSION = '1.0.0';
  var LANGUAGE_KEY = 'novarena_language';
  var PLAYER_KEY = 'novarena_guest_profile_v1';
  var SCORES_KEY = 'novarena_scores_v1';
  var contextCache = {};

  function resolveLanguage(lang) {
    var value = String(lang || '').toLowerCase().split('-')[0];
    return ['ca', 'es', 'en', 'it'].indexOf(value) >= 0 ? value : 'en';
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
    if (!gameId) {
      return null;
    }

    if (contextCache[gameId]) {
      return contextCache[gameId];
    }

    contextCache[gameId] = (async function () {
      try {
        return await readJsonFile('games/' + gameId + '/game.json');
      } catch (gameError) {
        try {
          var catalog = await readJsonFile('data/games.json');
          if (Array.isArray(catalog)) {
            var match = catalog.find(function (entry) {
              return entry && entry.id === gameId;
            });
            if (match) {
              return match;
            }
          }
        } catch (catalogError) {
          // Ignore and fall back below.
        }

        return {
          id: gameId,
          title: gameId,
          path: 'games/' + gameId + '/index.html'
        };
      }
    })();

    return contextCache[gameId];
  }

  function normalizeScorePayload(payload) {
    var player = getPlayer();
    var score = Number(payload && payload.score);

    if (!payload || !payload.game) {
      throw new Error('Novarena.submitScore(payload) requires a game id.');
    }

    if (!Number.isFinite(score)) {
      throw new Error('Novarena.submitScore(payload) requires a numeric score.');
    }

    return {
      game: String(payload.game),
      playerId: String(payload.playerId || player.id),
      playerName: String(payload.playerName || player.name),
      score: score,
      scoreType: String(payload.scoreType || 'points'),
      createdAt: payload.createdAt || new Date().toISOString()
    };
  }

  function readScores() {
    var scores = readJsonStorage(SCORES_KEY, []);
    return Array.isArray(scores) ? scores : [];
  }

  function writeScores(scores) {
    writeJsonStorage(SCORES_KEY, scores);
  }

  function submitScore(payload) {
    var entry = normalizeScorePayload(payload);
    var scores = readScores();
    scores.push(entry);
    writeScores(scores);
    return entry;
  }

  function getLeaderboard(gameId) {
    return readScores()
      .filter(function (entry) {
        return !gameId || entry.game === gameId;
      })
      .sort(function (left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return String(right.createdAt).localeCompare(String(left.createdAt));
      });
  }

  global.Novarena = {
    version: SDK_VERSION,
    getPlayer: getPlayer,
    getLanguage: getLanguage,
    getGameContext: getGameContext,
    submitScore: submitScore,
    getLeaderboard: getLeaderboard
  };
})(window);
