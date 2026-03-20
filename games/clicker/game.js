(function (global) {
  "use strict";

  var GAME_ID = "clicker";
  var bestSubmittedScore = 0;
  var lastSubmittedAt = 0;
  var MIN_SUBMIT_INTERVAL_MS = 15000;

  async function loadGameContext() {
    if (!global.Novarena || typeof global.Novarena.getGameContext !== "function") {
      return null;
    }

    try {
      return await global.Novarena.getGameContext(GAME_ID);
    } catch (error) {
      return null;
    }
  }

  function submitScore(finalScore) {
    var normalizedScore = Math.floor(Number(finalScore) || 0);
    var now = Date.now();

    if (!global.Novarena || typeof global.Novarena.submitScore !== "function") {
      return null;
    }

    if (normalizedScore <= 0 || normalizedScore <= bestSubmittedScore) {
      return null;
    }

    if (now - lastSubmittedAt < MIN_SUBMIT_INTERVAL_MS) {
      return null;
    }

    bestSubmittedScore = normalizedScore;
    lastSubmittedAt = now;

    try {
      return Promise.resolve(global.Novarena.submitScore({
        game: GAME_ID,
        score: normalizedScore,
        scoreType: "points"
      })).catch(function (error) {
        bestSubmittedScore = 0;
        throw error;
      });
    } catch (error) {
      bestSubmittedScore = 0;
      return null;
    }
  }

  global.NovarenaClickerBridge = {
    init: function () {
      loadGameContext().then(function (context) {
        if (context && context.title) {
          document.title = String(context.title);
        }
      });
    },

    resetRound: function () {
      lastSubmittedAt = 0;
    },

    submitScore: submitScore
  };
})(window);
