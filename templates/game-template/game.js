(function () {
  'use strict';

  var GAME_ID = 'your-game-id';
  var output = document.getElementById('output');
  var playButton = document.getElementById('playButton');
  var scoreButton = document.getElementById('scoreButton');
  var currentScore = 0;

  function print(value) {
    output.textContent = JSON.stringify(value, null, 2);
  }

  async function boot() {
    var player = Novarena.getPlayer();
    var language = Novarena.getLanguage();
    var context = await Novarena.getGameContext(GAME_ID);

    print({ player: player, language: language, context: context });
  }

  playButton.addEventListener('click', function () {
    currentScore += 25;
    print({ message: 'Sample round played', score: currentScore });
  });

  scoreButton.addEventListener('click', function () {
    var entry = Novarena.submitScore({
      game: GAME_ID,
      score: currentScore,
      scoreType: 'points'
    });

    print({ saved: entry, leaderboard: Novarena.getLeaderboard(GAME_ID).slice(0, 5) });
  });

  boot();
})();
