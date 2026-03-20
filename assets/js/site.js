var DEFAULT_GAMES = [
  { id: 'tetris', title: 'Tetris', description: 'Place the pieces, clear lines and keep the pressure under control round after round.', path: 'games/tetris/index.html', thumbnail: 'assets/img/game-tetris.svg', category: 'Puzzle' },
  { id: 'snake', title: 'Snake', description: 'Eat, grow and do not trap yourself. This classic is still a reflex machine.', path: 'games/snake/index.html', thumbnail: 'assets/img/game-snake.svg', category: 'Classic' },
  { id: 'runner3d', title: 'Neon Runner 3D', description: 'Run across a neon track, dodge obstacles and try to keep the run going.', path: 'games/runner-3d/index.html', thumbnail: 'assets/img/game-runner.svg', category: 'Runner' },
  { id: 'break-block', title: 'Break Block', description: 'Bounce the ball, clear the screen and keep the arcade rhythm going.', path: 'games/break-block/index.html', thumbnail: 'assets/img/game-break-block.svg', category: 'Arcade' },
  { id: 'clicker', title: 'Clicker', description: 'Build an AI robot, buy upgrades and turn an old laptop into a futuristic machine.', path: 'games/clicker/index.html', thumbnail: 'assets/img/game-clicker.svg', category: 'Idle' },
  { id: 'last-row-trouble', title: 'Last Row Trouble', description: 'Sneak out from the back row, complete cheeky missions and get back to your seat before the teacher notices.', path: 'games/last-row-trouble/index.html', thumbnail: 'assets/img/game-last-row-trouble.svg', category: 'Stealth' }
];

var DEFAULT_TOP_PLAYERS = [
  { name: 'NovaRay', mockFavorite: 'Snake', mockTotal: 12450 },
  { name: 'PixelMarta', mockFavorite: 'Tetris', mockTotal: 11820 },
  { name: 'TurboNil', mockFavorite: 'Runner 3D', mockTotal: 10660 },
  { name: 'ArcadeLia', mockFavorite: 'Break Block', mockTotal: 9980 },
  { name: 'KiroZen', mockFavorite: 'Snake', mockTotal: 9450 }
];
var HOME_CHALLENGE_COPY = {
  ca: {
    eyebrow: 'Repte del dia',
    title: 'Juga el repte destacat d\'avui',
    emptyTitle: 'No hi ha repte actiu ara mateix',
    emptyBody: 'Torna mes tard o entra a qualsevol joc per continuar sumant punts.',
    challengeLeaderboard: 'Veure challenge leaderboard',
    target: 'Objectiu',
    live: 'Actiu avui'
  },
  es: {
    eyebrow: 'Reto del dia',
    title: 'Juega el reto destacado de hoy',
    emptyTitle: 'No hay reto activo ahora mismo',
    emptyBody: 'Vuelve mas tarde o entra en cualquier juego para seguir sumando puntos.',
    challengeLeaderboard: 'Ver challenge leaderboard',
    target: 'Objetivo',
    live: 'Activo hoy'
  },
  en: {
    eyebrow: 'Daily Challenge',
    title: 'Play today\'s featured challenge',
    emptyTitle: 'There is no active challenge right now',
    emptyBody: 'Come back later or jump into any game and keep scoring.',
    challengeLeaderboard: 'View challenge leaderboard',
    target: 'Target',
    live: 'Live today'
  },
  it: {
    eyebrow: 'Sfida del giorno',
    title: 'Gioca la sfida in evidenza di oggi',
    emptyTitle: 'Non c\'e una sfida attiva in questo momento',
    emptyBody: 'Torna piu tardi o entra in qualsiasi gioco per continuare a fare punti.',
    challengeLeaderboard: 'Vedi challenge leaderboard',
    target: 'Obiettivo',
    live: 'Attiva oggi'
  }
};
var HOME_ACTIVITY_COPY = {
  ca: {
    title: 'Activitat recent',
    empty: 'Encara no hi ha activitat recent.',
    cta: 'Veure tota l\'activitat',
    points: 'punts',
    ago: 'fa'
  },
  es: {
    title: 'Actividad reciente',
    empty: 'Todavia no hay actividad reciente.',
    cta: 'Ver toda la actividad',
    points: 'puntos',
    ago: 'hace'
  },
  en: {
    title: 'Recent activity',
    empty: 'There is no recent activity yet.',
    cta: 'View all activity',
    points: 'points',
    ago: ''
  },
  it: {
    title: 'Attivita recente',
    empty: 'Non c\'e ancora attivita recente.',
    cta: 'Vedi tutta l\'attivita',
    points: 'punti',
    ago: ''
  }
};

async function fetchJson(path) {
  var response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load ' + path);
  }
  return response.json();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function findGameById(games, gameId) {
  return (games || []).find(function (game) {
    return game && game.id === gameId;
  }) || null;
}

function getHomeChallengeCopy() {
  var lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'en';
  return HOME_CHALLENGE_COPY[lang] || HOME_CHALLENGE_COPY.en;
}

function getHomeActivityCopy() {
  var lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'en';
  return HOME_ACTIVITY_COPY[lang] || HOME_ACTIVITY_COPY.en;
}

function relativeTime(value) {
  var lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'en';
  var locales = { ca: 'ca-ES', es: 'es-ES', en: 'en-US', it: 'it-IT' };
  var date = value ? new Date(value) : null;
  var seconds;
  var minutes;
  var hours;
  var days;
  var formatter;

  if (!date || Number.isNaN(date.getTime())) {
    return '-';
  }

  seconds = Math.round((date.getTime() - Date.now()) / 1000);
  minutes = Math.round(seconds / 60);
  hours = Math.round(minutes / 60);
  days = Math.round(hours / 24);
  formatter = typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function'
    ? new Intl.RelativeTimeFormat(locales[lang] || 'en-US', { numeric: 'auto' })
    : null;

  if (!formatter) {
    return date.toLocaleString(locales[lang] || 'en-US');
  }

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }

  return formatter.format(days, 'day');
}

function activityItemTemplate(item, games) {
  var game = findGameById(games, item.game) || {
    id: item.game,
    title: item.game,
    path: 'games/' + item.game + '/index.html'
  };
  var copy = getHomeActivityCopy();

  return [
    '<div class="activity-item">',
    '  <strong>' + escapeHtml(item.playerName || t('common.player', 'Player')) + ' - ' + escapeHtml(game.title) + ' - ' + escapeHtml(formatScore(item.score)) + ' ' + escapeHtml(copy.points) + '</strong>',
    '  <p><a href="' + escapeHtml(game.path) + '">' + escapeHtml(t('common.play', 'Play')) + ' ' + escapeHtml(game.title) + '</a></p>',
    '  <div class="activity-meta">' + escapeHtml(relativeTime(item.createdAt)) + '</div>',
    '</div>'
  ].join('');
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

async function renderCurrentChallenge() {
  var shell = document.querySelector('[data-daily-challenge]');
  var copy = getHomeChallengeCopy();
  var eyebrowNode = document.querySelector('[data-daily-challenge-eyebrow]');
  var titleNode = document.querySelector('[data-daily-challenge-title]');
  var results;
  var challenge;
  var games;
  var game;
  var gameInfo;
  var challengeDate;
  var targetMarkup;
  var metaMarkup;

  if (!shell) {
    return;
  }

  if (eyebrowNode) {
    eyebrowNode.textContent = copy.eyebrow;
  }

  if (titleNode) {
    titleNode.textContent = copy.title;
  }

  if (!window.Novarena || typeof window.Novarena.getCurrentChallengeAsync !== 'function') {
    shell.innerHTML = [
      '<article class="challenge-spotlight challenge-empty">',
      '  <div class="challenge-copy">',
      '    <p class="eyebrow">' + escapeHtml(copy.eyebrow) + '</p>',
      '    <h3>' + escapeHtml(copy.emptyTitle) + '</h3>',
      '    <p>' + escapeHtml(copy.emptyBody) + '</p>',
      '  </div>',
      '</article>'
    ].join('');
    return;
  }

  results = await Promise.all([
    window.Novarena.getCurrentChallengeAsync(),
    loadGames()
  ]);
  challenge = results[0];
  games = results[1];

  if (!challenge) {
    shell.innerHTML = [
      '<article class="challenge-spotlight challenge-empty">',
      '  <div class="challenge-copy">',
      '    <p class="eyebrow">' + escapeHtml(copy.eyebrow) + '</p>',
      '    <h3>' + escapeHtml(copy.emptyTitle) + '</h3>',
      '    <p>' + escapeHtml(copy.emptyBody) + '</p>',
      '  </div>',
      '</article>'
    ].join('');
    return;
  }

  game = findGameById(games, challenge.game);
  gameInfo = game ? localizedGameData(game) : {
    title: challenge.game,
    description: '',
    category: challenge.game,
    path: 'games/' + challenge.game + '/index.html',
    thumbnail: ''
  };
  challengeDate = new Date(String(challenge.date) + 'T00:00:00.000Z');
  targetMarkup = challenge.targetValue == null
    ? ''
    : '<span class="challenge-chip">' + escapeHtml(copy.target) + ': ' + escapeHtml(formatScore(challenge.targetValue)) + '</span>';
  metaMarkup = [
    '<span class="challenge-chip">' + escapeHtml(gameInfo.title) + '</span>',
    '<span class="challenge-chip">' + escapeHtml(copy.live) + '</span>'
  ];

  if (targetMarkup) {
    metaMarkup.push(targetMarkup);
  }

  shell.innerHTML = [
    '<article class="challenge-spotlight">',
    '  <div class="challenge-copy">',
    '    <p class="eyebrow">' + escapeHtml(copy.eyebrow) + '</p>',
    '    <h2>' + escapeHtml(challenge.title) + '</h2>',
    '    <p>' + escapeHtml(challenge.description) + '</p>',
    '    <div class="challenge-meta-row">' + metaMarkup.join('') + '</div>',
    '    <div class="challenge-actions">',
    '      <a class="button button-primary" href="' + escapeHtml(gameInfo.path) + '">' + escapeHtml(t('common.play', 'Play')) + '</a>',
    '      <a class="button button-secondary" href="leaderboard.html?challenge=' + encodeURIComponent(challenge.id) + '">' + escapeHtml(copy.challengeLeaderboard) + '</a>',
    '    </div>',
    '  </div>',
    '  <div class="challenge-side">',
    '    <span class="challenge-kicker">' + escapeHtml(gameInfo.category) + '</span>',
    '    <strong>' + escapeHtml(Number.isNaN(challengeDate.getTime()) ? challenge.date : challengeDate.toLocaleDateString()) + '</strong>',
    '    <p>' + escapeHtml(gameInfo.description || challenge.description) + '</p>',
    '  </div>',
    '</article>'
  ].join('');
}

async function renderHomeActivity() {
  var shell = document.querySelector('[data-home-activity]');
  var titleNode = document.querySelector('.activity-card h2');
  var button = document.querySelector('.activity-card .button');
  var games;
  var items;
  var copy = getHomeActivityCopy();

  if (!shell) {
    return;
  }

  if (titleNode) {
    titleNode.textContent = copy.title;
  }

  if (button) {
    button.textContent = copy.cta;
  }

  games = await loadGames();

  if (!window.Novarena || typeof window.Novarena.getActivityAsync !== 'function') {
    shell.innerHTML = '<p class="empty-state">' + escapeHtml(copy.empty) + '</p>';
    return;
  }

  items = await window.Novarena.getActivityAsync({ limit: 5 });

  if (!items.length) {
    shell.innerHTML = '<p class="empty-state">' + escapeHtml(copy.empty) + '</p>';
    return;
  }

  shell.innerHTML = items.map(function (item) {
    return activityItemTemplate(item, games);
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  var initialLanguage = resolveLanguage(getSavedLanguage() || detectLanguage());
  renderCurrentYear();
  initLanguageSelector();
  setLanguage(initialLanguage, false);
});
