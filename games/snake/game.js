(function (global) {
  'use strict';

  var GAME_ID = 'snake';

  function getCurrentPlayer() {
    if (!global.Novarena || typeof global.Novarena.getPlayer !== 'function') {
      return null;
    }
    return global.Novarena.getPlayer();
  }

  function syncHiScoreFromPlatform() {
    if (!global.Novarena || typeof global.Novarena.getLeaderboard !== 'function') {
      return;
    }

    var player = getCurrentPlayer();
    var personalBest = global.Novarena.getLeaderboard(GAME_ID)
      .filter(function (entry) {
        return player && entry.playerId === player.id;
      })
      .reduce(function (best, entry) {
        return Math.max(best, Number(entry.score) || 0);
      }, 0);

    if (typeof hiScore === 'number' && personalBest > hiScore) {
      hiScore = personalBest;
      try {
        localStorage.setItem('snek_hi', String(hiScore));
      } catch (error) {
        // Ignore localStorage write failures.
      }
    }

    if (typeof updateHUD === 'function') {
      updateHUD();
    }
  }

  async function loadGameContext() {
    if (!global.Novarena || typeof global.Novarena.getGameContext !== 'function') {
      return null;
    }

    try {
      return await global.Novarena.getGameContext(GAME_ID);
    } catch (error) {
      return null;
    }
  }

  global.NovarenaSnakeBridge = {
    init: function () {
      loadGameContext().then(function (context) {
        if (context && context.title) {
          document.title = String(context.title).toUpperCase();
        }
      });
      syncHiScoreFromPlatform();
    },

    submitScore: function () {
      if (!global.Novarena || typeof global.Novarena.submitScore !== 'function') {
        return null;
      }

      if (typeof score !== 'number' || score <= 0) {
        return null;
      }

      return global.Novarena.submitScore({
        game: GAME_ID,
        score: score,
        scoreType: 'points'
      });
    }
  };
})(window);
