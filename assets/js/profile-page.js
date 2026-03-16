(function (global) {
  'use strict';

  var LOCALES = {
    ca: 'ca-ES',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT'
  };
  var PROFILE_COPY = {
    ca: {
      eyebrow: 'Jugador actual',
      subtitle: 'Aquest perfil es construeix a partir del player actual del SDK i de les scores reals guardades per Novarena.',
      playerId: 'Player ID',
      storageMode: 'Mode',
      bestGlobal: 'Millor score global',
      trackedGames: 'Jocs amb score',
      recentCount: 'Activitat recent',
      challengeRank: 'Posicio al challenge',
      challengeRankEmpty: 'Sense rank',
      bestByGame: 'Millor score per joc',
      recentActivity: 'Activitat recent',
      dailyChallenge: 'Daily challenge',
      emptyScores: 'Encara no tens scores guardades. Juga una partida i aquest perfil comencara a omplir-se.',
      emptyRecent: 'Encara no hi ha activitat recent per mostrar.',
      emptyChallenge: 'No hi ha cap repte actiu ara mateix.',
      emptyChallengeEntry: 'Encara no has enviat cap score per al repte actiu.',
      score: 'Score',
      game: 'Joc',
      date: 'Data',
      position: 'Posicio',
      challengeParticipants: 'Participants',
      play: 'Jugar',
      viewLeaderboard: 'Veure leaderboard',
      activityNote: 'Les entrades mostren l\'historial recent del teu navegador actual.',
      nameLabel: 'Nom de jugador',
      namePlaceholder: 'Escriu el teu nom',
      saveName: 'Guardar',
      saveSuccess: 'Nom actualitzat.',
      fallbackPlayer: 'Jugador'
    },
    es: {
      eyebrow: 'Jugador actual',
      subtitle: 'Este perfil se construye a partir del jugador actual del SDK y de las scores reales guardadas por Novarena.',
      playerId: 'Player ID',
      storageMode: 'Modo',
      bestGlobal: 'Mejor score global',
      trackedGames: 'Juegos con score',
      recentCount: 'Actividad reciente',
      challengeRank: 'Posicion en challenge',
      challengeRankEmpty: 'Sin ranking',
      bestByGame: 'Mejor score por juego',
      recentActivity: 'Actividad reciente',
      dailyChallenge: 'Daily challenge',
      emptyScores: 'Todavia no tienes scores guardadas. Juega una partida y este perfil empezara a llenarse.',
      emptyRecent: 'Todavia no hay actividad reciente para mostrar.',
      emptyChallenge: 'No hay ningun reto activo ahora mismo.',
      emptyChallengeEntry: 'Todavia no has enviado ninguna score para el reto activo.',
      score: 'Score',
      game: 'Juego',
      date: 'Fecha',
      position: 'Posicion',
      challengeParticipants: 'Participantes',
      play: 'Jugar',
      viewLeaderboard: 'Ver leaderboard',
      activityNote: 'Las entradas muestran el historial reciente de tu navegador actual.',
      nameLabel: 'Nombre de jugador',
      namePlaceholder: 'Escribe tu nombre',
      saveName: 'Guardar',
      saveSuccess: 'Nombre actualizado.',
      fallbackPlayer: 'Jugador'
    },
    en: {
      eyebrow: 'Current player',
      subtitle: 'This profile is built from the SDK current player and the real scores saved by Novarena.',
      playerId: 'Player ID',
      storageMode: 'Mode',
      bestGlobal: 'Best global score',
      trackedGames: 'Games with scores',
      recentCount: 'Recent activity',
      challengeRank: 'Challenge rank',
      challengeRankEmpty: 'Unranked',
      bestByGame: 'Best score by game',
      recentActivity: 'Recent activity',
      dailyChallenge: 'Daily challenge',
      emptyScores: 'You do not have any saved scores yet. Play a run and this profile will start filling in.',
      emptyRecent: 'There is no recent activity to show yet.',
      emptyChallenge: 'There is no active challenge right now.',
      emptyChallengeEntry: 'You have not submitted a score for the active challenge yet.',
      score: 'Score',
      game: 'Game',
      date: 'Date',
      position: 'Rank',
      challengeParticipants: 'Participants',
      play: 'Play',
      viewLeaderboard: 'View leaderboard',
      activityNote: 'These entries show the recent history for your current browser player.',
      nameLabel: 'Player name',
      namePlaceholder: 'Type your name',
      saveName: 'Save',
      saveSuccess: 'Name updated.',
      fallbackPlayer: 'Player'
    },
    it: {
      eyebrow: 'Giocatore attuale',
      subtitle: 'Questo profilo viene costruito dal giocatore corrente dello SDK e dai punteggi reali salvati da Novarena.',
      playerId: 'Player ID',
      storageMode: 'Modalita',
      bestGlobal: 'Miglior score globale',
      trackedGames: 'Giochi con score',
      recentCount: 'Attivita recente',
      challengeRank: 'Posizione challenge',
      challengeRankEmpty: 'Senza rank',
      bestByGame: 'Miglior score per gioco',
      recentActivity: 'Attivita recente',
      dailyChallenge: 'Daily challenge',
      emptyScores: 'Non hai ancora score salvati. Gioca una partita e questo profilo iniziera a riempirsi.',
      emptyRecent: 'Non c\'e ancora attivita recente da mostrare.',
      emptyChallenge: 'Non c\'e alcuna sfida attiva in questo momento.',
      emptyChallengeEntry: 'Non hai ancora inviato uno score per la sfida attiva.',
      score: 'Score',
      game: 'Gioco',
      date: 'Data',
      position: 'Posizione',
      challengeParticipants: 'Partecipanti',
      play: 'Gioca',
      viewLeaderboard: 'Vedi leaderboard',
      activityNote: 'Queste voci mostrano la cronologia recente del giocatore nel browser attuale.',
      nameLabel: 'Nome giocatore',
      namePlaceholder: 'Scrivi il tuo nome',
      saveName: 'Salva',
      saveSuccess: 'Nome aggiornato.',
      fallbackPlayer: 'Giocatore'
    }
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function currentLanguage() {
    if (typeof getCurrentLanguage === 'function') {
      return getCurrentLanguage();
    }

    if (global.Novarena && typeof global.Novarena.getLanguage === 'function') {
      return global.Novarena.getLanguage();
    }

    return 'en';
  }

  function profileCopy() {
    return PROFILE_COPY[currentLanguage()] || PROFILE_COPY.en;
  }

  function playerName(profile) {
    var copy = profileCopy();
    return profile && profile.player && profile.player.name
      ? profile.player.name
      : copy.fallbackPlayer;
  }

  function formatDate(value) {
    var date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString(LOCALES[currentLanguage()] || 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  function formatDateOnly(value) {
    var date = value ? new Date(String(value) + 'T00:00:00.000Z') : null;

    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(LOCALES[currentLanguage()] || 'en-US', {
      dateStyle: 'medium'
    });
  }

  function gameLabel(gameId, contexts) {
    var context = contexts && contexts[gameId];

    if (context && (context.title || context.name)) {
      return String(context.title || context.name);
    }

    if (gameId === 'runner3d') {
      return 'Runner 3D';
    }

    return String(gameId || '-')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function gamePath(gameId, contexts) {
    var context = contexts && contexts[gameId];

    if (context && context.path) {
      return context.path;
    }

    return 'games/' + String(gameId || '').replace(/[^a-z0-9-]/gi, '') + '/index.html';
  }

  async function loadGameContexts(gameIds) {
    var uniqueIds = Array.from(new Set((gameIds || []).filter(Boolean)));
    var contexts = {};

    if (!global.Novarena || typeof global.Novarena.getGameContext !== 'function') {
      return contexts;
    }

    await Promise.all(uniqueIds.map(function (gameId) {
      return global.Novarena.getGameContext(gameId).then(function (context) {
        contexts[gameId] = context || null;
      }).catch(function () {
        contexts[gameId] = null;
      });
    }));

    return contexts;
  }

  function profileStatMarkup(label, value) {
    return [
      '<article class="feature-card">',
      '  <span class="stat-label">' + escapeHtml(label) + '</span>',
      '  <strong class="stat-value">' + escapeHtml(value) + '</strong>',
      '</article>'
    ].join('');
  }

  function tableMarkup(entries, contexts, emptyText) {
    var copy = profileCopy();

    if (!entries.length) {
      return '<p class="empty-state">' + escapeHtml(emptyText) + '</p>';
    }

    var rows = entries.map(function (entry, index) {
      return [
        '<tr>',
        '  <td><span class="rank-pill">' + (index + 1) + '</span></td>',
        '  <td><a href="' + escapeHtml(gamePath(entry.game, contexts)) + '">' + escapeHtml(gameLabel(entry.game, contexts)) + '</a></td>',
        '  <td>' + escapeHtml(String(entry.score)) + '</td>',
        '  <td>' + escapeHtml(formatDate(entry.createdAt)) + '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<table class="leaderboard-table">',
      '  <thead>',
      '    <tr>',
      '      <th>' + escapeHtml(copy.position) + '</th>',
      '      <th>' + escapeHtml(copy.game) + '</th>',
      '      <th>' + escapeHtml(copy.score) + '</th>',
      '      <th>' + escapeHtml(copy.date) + '</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>' + rows + '</tbody>',
      '</table>'
    ].join('');
  }

  function challengeMarkup(profile, contexts) {
    var copy = profileCopy();
    var activeChallenge = profile && profile.activeChallenge ? profile.activeChallenge : null;
    var challenge = activeChallenge && activeChallenge.challenge ? activeChallenge.challenge : null;
    var entry = activeChallenge && activeChallenge.entry ? activeChallenge.entry : null;
    var playHref;
    var leaderboardHref;

    if (!challenge) {
      return '<p class="empty-state">' + escapeHtml(copy.emptyChallenge) + '</p>';
    }

    playHref = gamePath(challenge.game, contexts);
    leaderboardHref = 'leaderboard.html?challenge=' + encodeURIComponent(challenge.id);

    return [
      '<div class="hero">',
      '  <div class="hero-copy">',
      '    <p class="eyebrow">' + escapeHtml(copy.dailyChallenge) + '</p>',
      '    <h2 style="margin-top:0">' + escapeHtml(challenge.title) + '</h2>',
      '    <p>' + escapeHtml(challenge.description || '') + '</p>',
      '    <div class="hero-actions">',
      '      <a class="button button-primary" href="' + escapeHtml(playHref) + '">' + escapeHtml(copy.play) + '</a>',
      '      <a class="button button-secondary" href="' + escapeHtml(leaderboardHref) + '">' + escapeHtml(copy.viewLeaderboard) + '</a>',
      '    </div>',
      '  </div>',
      '  <div class="hero-side">',
      '    <div class="stat-card">',
      '      <span class="stat-label">' + escapeHtml(copy.game) + '</span>',
      '      <strong class="stat-value">' + escapeHtml(gameLabel(challenge.game, contexts)) + '</strong>',
      '    </div>',
      '    <div class="stat-card">',
      '      <span class="stat-label">' + escapeHtml(copy.date) + '</span>',
      '      <strong class="stat-value">' + escapeHtml(formatDateOnly(challenge.date)) + '</strong>',
      '    </div>',
      '    <div class="stat-card">',
      '      <span class="stat-label">' + escapeHtml(copy.challengeRank) + '</span>',
      '      <strong class="stat-value">' + escapeHtml(entry ? '#' + activeChallenge.rank : copy.challengeRankEmpty) + '</strong>',
      '    </div>',
      '    <div class="stat-card">',
      '      <span class="stat-label">' + escapeHtml(copy.challengeParticipants) + '</span>',
      '      <strong class="stat-value">' + escapeHtml(entry ? String(activeChallenge.totalPlayers || 0) : '-') + '</strong>',
      '    </div>',
      entry ? [
        '    <div class="stat-card">',
        '      <span class="stat-label">' + escapeHtml(copy.score) + '</span>',
        '      <strong class="stat-value">' + escapeHtml(String(entry.score)) + '</strong>',
        '    </div>'
      ].join('') : [
        '    <p class="empty-state">' + escapeHtml(copy.emptyChallengeEntry) + '</p>'
      ].join(''),
      '  </div>',
      '</div>'
    ].join('');
  }

  function renderHero(profile, contexts) {
    var shell = document.querySelector('[data-profile-hero]');
    var copy = profileCopy();
    var bestEntry = profile.bestGlobalEntry;
    var gameName = bestEntry ? gameLabel(bestEntry.game, contexts) : '-';
    var gameHref = bestEntry ? gamePath(bestEntry.game, contexts) : 'games.html';
    var leaderboardHref = bestEntry
      ? 'leaderboard.html?game=' + encodeURIComponent(bestEntry.game)
      : 'leaderboard.html';
    var mode = global.Novarena && typeof global.Novarena.getConfig === 'function'
      ? global.Novarena.getConfig().storageMode
      : 'local';

    if (!shell) {
      return;
    }

    shell.innerHTML = [
      '<p class="eyebrow">' + escapeHtml(copy.eyebrow) + '</p>',
      '<h1><span>' + escapeHtml(playerName(profile)) + '</span></h1>',
      '<p>' + escapeHtml(copy.subtitle) + '</p>',
      '<div class="hero-actions">',
      '  <span class="game-category">' + escapeHtml(copy.playerId) + ': ' + escapeHtml(profile.player.id) + '</span>',
      '  <span class="game-category">' + escapeHtml(copy.storageMode) + ': ' + escapeHtml(String(mode)) + '</span>',
      '</div>',
      '<form class="hero-actions" data-profile-name-form>',
      '  <label style="display:flex;flex-direction:column;gap:8px;min-width:min(320px,100%)">',
      '    <span class="stat-label">' + escapeHtml(copy.nameLabel) + '</span>',
      '    <input data-profile-name-input type="text" maxlength="64" value="' + escapeHtml(profile.player && profile.player.name ? profile.player.name : '') + '" placeholder="' + escapeHtml(copy.namePlaceholder) + '" style="padding:14px 16px;border-radius:14px;border:1px solid rgba(104,216,255,.22);background:#08111f;color:#edf5ff;font:inherit;">',
      '  </label>',
      '  <button class="button button-primary" type="submit">' + escapeHtml(copy.saveName) + '</button>',
      '</form>',
      '<p class="empty-state" data-profile-name-status style="display:none"></p>',
      bestEntry ? [
        '<div class="hero-actions">',
        '  <a class="button button-primary" href="' + escapeHtml(gameHref) + '">' + escapeHtml(gameName) + '</a>',
        '  <a class="button button-secondary" href="' + escapeHtml(leaderboardHref) + '">' + escapeHtml(copy.viewLeaderboard) + '</a>',
        '</div>'
      ].join('') : ''
    ].join('');

    bindNameEditor();
  }

  function bindNameEditor() {
    var form = document.querySelector('[data-profile-name-form]');
    var input = document.querySelector('[data-profile-name-input]');
    var status = document.querySelector('[data-profile-name-status]');
    var copy = profileCopy();

    if (!form || !input || !global.Novarena || typeof global.Novarena.setPlayerName !== 'function') {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!String(input.value || '').trim()) {
        input.focus();
        return;
      }

      global.Novarena.setPlayerName(input.value);

      if (status) {
        status.style.display = 'block';
        status.textContent = copy.saveSuccess;
      }

      renderProfilePage();
    });
  }

  function renderStats(profile) {
    var shell = document.querySelector('[data-profile-stats]');
    var copy = profileCopy();
    var challengeRank = profile.activeChallenge && profile.activeChallenge.rank
      ? '#' + profile.activeChallenge.rank
      : copy.challengeRankEmpty;

    if (!shell) {
      return;
    }

    shell.innerHTML = [
      profileStatMarkup(copy.bestGlobal, profile.bestGlobalEntry ? String(profile.bestGlobalEntry.score) : '-'),
      profileStatMarkup(copy.trackedGames, String(profile.bestPerGame.length)),
      profileStatMarkup(copy.recentCount, String(profile.recentEntries.length)),
      profileStatMarkup(copy.challengeRank, challengeRank)
    ].join('');
  }

  function renderBestByGame(profile, contexts) {
    var shell = document.querySelector('[data-profile-best-games]');
    var countNode = document.querySelector('[data-profile-best-games-count]');
    var titleNode = document.querySelector('[data-profile-best-games-title]');
    var copy = profileCopy();

    if (titleNode) {
      titleNode.textContent = copy.bestByGame;
    }

    if (countNode) {
      countNode.textContent = String(profile.bestPerGame.length);
    }

    if (shell) {
      shell.innerHTML = tableMarkup(profile.bestPerGame, contexts, copy.emptyScores);
    }
  }

  function renderRecent(profile, contexts) {
    var shell = document.querySelector('[data-profile-recent]');
    var countNode = document.querySelector('[data-profile-recent-count]');
    var titleNode = document.querySelector('[data-profile-recent-title]');
    var copy = profileCopy();

    if (titleNode) {
      titleNode.textContent = copy.recentActivity;
    }

    if (countNode) {
      countNode.textContent = String(profile.recentEntries.length);
    }

    if (shell) {
      shell.innerHTML = tableMarkup(profile.recentEntries, contexts, copy.emptyRecent);

      if (profile.recentEntries.length) {
        shell.innerHTML += '<p class="empty-state" style="margin-top:18px">' + escapeHtml(copy.activityNote) + '</p>';
      }
    }
  }

  function renderChallenge(profile, contexts) {
    var shell = document.querySelector('[data-profile-challenge]');
    var titleNode = document.querySelector('[data-profile-challenge-title]');
    var copy = profileCopy();

    if (titleNode) {
      titleNode.textContent = copy.dailyChallenge;
    }

    if (shell) {
      shell.innerHTML = challengeMarkup(profile, contexts);
    }
  }

  function renderError(message) {
    var selector = [
      '[data-profile-hero]',
      '[data-profile-stats]',
      '[data-profile-best-games]',
      '[data-profile-recent]',
      '[data-profile-challenge]'
    ];

    selector.forEach(function (item) {
      var node = document.querySelector(item);

      if (node) {
        node.innerHTML = '<p class="error-state">' + escapeHtml(message) + '</p>';
      }
    });
  }

  async function renderProfilePage() {
    var profile;
    var gameIds;
    var contexts;

    if (!document.querySelector('[data-profile-hero]')) {
      return;
    }

    if (!global.Novarena || typeof global.Novarena.getCurrentProfileAsync !== 'function') {
      renderError('Novarena SDK is not available on this page.');
      return;
    }

    try {
      profile = await global.Novarena.getCurrentProfileAsync({ recentLimit: 6 });
      gameIds = []
        .concat(profile.bestPerGame.map(function (entry) { return entry.game; }))
        .concat(profile.recentEntries.map(function (entry) { return entry.game; }))
        .concat(profile.bestGlobalEntry ? [profile.bestGlobalEntry.game] : [])
        .concat(profile.activeChallenge && profile.activeChallenge.challenge ? [profile.activeChallenge.challenge.game] : []);
      contexts = await loadGameContexts(gameIds);

      renderHero(profile, contexts);
      renderStats(profile);
      renderBestByGame(profile, contexts);
      renderRecent(profile, contexts);
      renderChallenge(profile, contexts);
    } catch (error) {
      renderError('Unable to load the current player profile right now.');
    }
  }

  global.renderProfilePage = renderProfilePage;

  document.addEventListener('DOMContentLoaded', function () {
    renderProfilePage();
  });
})(window);
