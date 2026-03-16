var DEFAULT_GAMES = [
  { id: 'tetris', title: 'Tetris', description: 'Place the pieces, clear lines and keep the pressure under control round after round.', path: 'games/tetris/index.html', thumbnail: 'assets/img/game-tetris.svg', category: 'Puzzle' },
  { id: 'snake', title: 'Snake', description: 'Eat, grow and do not trap yourself. This classic is still a reflex machine.', path: 'games/snake/index.html', thumbnail: 'assets/img/game-snake.svg', category: 'Classic' },
  { id: 'runner3d', title: 'Neon Runner 3D', description: 'Run across a neon track, dodge obstacles and try to keep the run going.', path: 'games/runner-3d/index.html', thumbnail: 'assets/img/game-runner.svg', category: 'Runner' },
  { id: 'break-block', title: 'Break Block', description: 'Bounce the ball, clear the screen and keep the arcade rhythm going.', path: 'games/break-block/index.html', thumbnail: 'assets/img/game-break-block.svg', category: 'Arcade' }
];

var DEFAULT_TOP_PLAYERS = [
  { name: 'NovaRay', mockFavorite: 'Snake', mockTotal: 12450 },
  { name: 'PixelMarta', mockFavorite: 'Tetris', mockTotal: 11820 },
  { name: 'TurboNil', mockFavorite: 'Runner 3D', mockTotal: 10660 },
  { name: 'ArcadeLia', mockFavorite: 'Break Block', mockTotal: 9980 },
  { name: 'KiroZen', mockFavorite: 'Snake', mockTotal: 9450 }
];

async function fetchJson(path) {
  var response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load ' + path);
  }
  return response.json();
}

async function loadGames() {
  try {
    return await fetchJson('data/games.json');
  } catch (error) {
    return DEFAULT_GAMES;
  }
}

async function loadPlayersPayload() {
  try {
    return await fetchJson('data/players.json');
  } catch (error) {
    return { players: [] };
  }
}

function formatScore(value) {
  var locales = { ca: 'ca-ES', es: 'es-ES', en: 'en-US', it: 'it-IT' };
  return typeof value === 'number' ? value.toLocaleString(locales[getCurrentLanguage()] || 'en-US') : '-';
}

function localizedGameData(game) {
  return {
    title: game.title,
    description: t('gamesData.' + game.id + '.description', game.description),
    category: t('gamesData.' + game.id + '.category', game.category),
    path: game.path,
    thumbnail: game.thumbnail
  };
}

function gameCardTemplate(game) {
  var localized = localizedGameData(game);

  return [
    '<a class="game-card" href="' + localized.path + '">',
    '  <img src="' + localized.thumbnail + '" alt="' + localized.title + '">',
    '  <div class="game-card-body">',
    '    <div class="game-card-top">',
    '      <h3>' + localized.title + '</h3>',
    '      <span class="game-category">' + localized.category + '</span>',
    '    </div>',
    '    <p>' + localized.description + '</p>',
    '    <span class="game-card-cta">' + t('common.play', 'Play') + '</span>',
    '  </div>',
    '</a>'
  ].join('');
}

async function renderGames() {
  var grids = document.querySelectorAll('[data-games-grid]');
  if (!grids.length) {
    return;
  }

  var games = await loadGames();
  document.querySelectorAll('[data-game-count]').forEach(function (node) {
    node.textContent = String(games.length);
  });

  grids.forEach(function (grid) {
    var limit = Number(grid.dataset.limit || 0);
    var items = limit > 0 ? games.slice(0, limit) : games;
    grid.innerHTML = items.map(gameCardTemplate).join('');
  });
}

function totalScore(player, gameIds) {
  return gameIds.reduce(function (sum, gameId) {
    var value = player && player.scores && player.scores[gameId] ? player.scores[gameId].best : null;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

function leaderboardTemplate(players, games) {
  var columns = games.map(function (game) {
    return '<th>' + game.title + '</th>';
  }).join('');

  var rows = players.map(function (player, index) {
    var scoreCells = games.map(function (game) {
      var best = player && player.scores && player.scores[game.id] ? player.scores[game.id].best : null;
      return '<td>' + formatScore(best) + '</td>';
    }).join('');

    return [
      '<tr>',
      '  <td><span class="rank-pill">' + (index + 1) + '</span></td>',
      '  <td>' + (player.name || t('common.player', 'Player')) + '</td>',
      scoreCells,
      '</tr>'
    ].join('');
  }).join('');

  return [
    '<table class="leaderboard-table">',
    '  <thead>',
    '    <tr>',
    '      <th>' + t('common.position', 'Position') + '</th>',
    '      <th>' + t('common.player', 'Player') + '</th>',
    columns,
    '    </tr>',
    '  </thead>',
    '  <tbody>' + rows + '</tbody>',
    '</table>'
  ].join('');
}

async function renderLeaderboard() {
  var shell = document.querySelector('[data-leaderboard]');
  if (!shell) {
    return;
  }

  var results = await Promise.all([loadGames(), loadPlayersPayload()]);
  var games = results[0];
  var playersPayload = results[1];
  var players = Array.isArray(playersPayload.players) ? playersPayload.players.slice() : [];
  var gameIds = games.map(function (game) { return game.id; });

  players.sort(function (left, right) {
    return totalScore(right, gameIds) - totalScore(left, gameIds);
  });

  if (!players.length) {
    shell.innerHTML = '<p class="empty-state">' + t('common.emptyLeaderboard', 'There are no saved scores yet.') + '</p>';
    return;
  }

  shell.innerHTML = leaderboardTemplate(players, games);
}

function favoriteGameTitle(player, games) {
  var bestGame = null;
  var bestScore = -1;

  games.forEach(function (game) {
    var score = player && player.scores && player.scores[game.id] ? player.scores[game.id].best : null;
    if (typeof score === 'number' && score > bestScore) {
      bestScore = score;
      bestGame = game.title;
    }
  });

  return bestGame || t('common.noScores', 'No scores');
}

function topPlayerTemplate(player, index, games, gameIds) {
  var total = typeof player.mockTotal === 'number' ? player.mockTotal : totalScore(player, gameIds);
  var favorite = player.mockFavorite || favoriteGameTitle(player, games);

  return [
    '<article class="top-player-card">',
    '  <div class="top-player-rank">#' + (index + 1) + '</div>',
    '  <div class="top-player-body">',
    '    <h3>' + (player.name || t('common.player', 'Player')) + '</h3>',
    '    <p>' + t('common.bestAt', 'Best at') + ' ' + favorite + '</p>',
    '  </div>',
    '  <div class="top-player-score">' + formatScore(total) + '</div>',
    '</article>'
  ].join('');
}

async function renderTopPlayers() {
  var shell = document.querySelector('[data-top-players]');
  if (!shell) {
    return;
  }

  var results = await Promise.all([loadGames(), loadPlayersPayload()]);
  var games = results[0];
  var playersPayload = results[1];
  var players = Array.isArray(playersPayload.players) ? playersPayload.players.slice() : [];
  var gameIds = games.map(function (game) { return game.id; });

  players.sort(function (left, right) {
    return totalScore(right, gameIds) - totalScore(left, gameIds);
  });

  if (!players.length) {
    shell.innerHTML = DEFAULT_TOP_PLAYERS.map(function (player, index) {
      return topPlayerTemplate(player, index, games, gameIds);
    }).join('');
    return;
  }

  shell.innerHTML = players.slice(0, 5).map(function (player, index) {
    return topPlayerTemplate(player, index, games, gameIds);
  }).join('');
}

function renderCurrentYear() {
  document.querySelectorAll('[data-current-year]').forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var initialLanguage = resolveLanguage(getSavedLanguage() || detectLanguage());
  renderCurrentYear();
  initLanguageSelector();
  setLanguage(initialLanguage, false);
});
