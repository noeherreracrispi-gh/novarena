(function (global) {
  'use strict';

  var GAME_ID = 'tetris';
  var submitted = false;

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

  function resetRound() {
    submitted = false;
  }

  function submitScore(finalScore) {
    var payload;

    if (submitted || !global.Novarena || typeof global.Novarena.submitScore !== 'function') {
      return null;
    }

    if (typeof finalScore !== 'number' || finalScore <= 0) {
      return null;
    }

    payload = {
      game: GAME_ID,
      score: finalScore,
      scoreType: 'points'
    };

    submitted = true;
    console.log('NOVARENA SUBMIT SCORE', payload);
    return global.Novarena.submitScore(payload);
  }

  global.NovarenaTetrisBridge = {
    resetRound: resetRound,
    submitScore: submitScore
  };

  loadGameContext().then(function (context) {
    if (context && context.title) {
      document.title = String(context.title).toUpperCase();
    }
  });
})(window);
