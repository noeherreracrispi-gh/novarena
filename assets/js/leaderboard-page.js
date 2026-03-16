(function (global) {
  'use strict';

  var LOCALES = {
    ca: 'ca-ES',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT'
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

  function formatDate(value) {
    var date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString(LOCALES[currentLanguage()] || 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  function normalizeGameId(gameId) {
    return gameId === 'runner-3d' ? 'runner3d' : gameId;
  }

  function formatGameLabel(gameId) {
    var normalizedGameId = normalizeGameId(gameId);

    if (!normalizedGameId) {
      return '-';
    }

    if (normalizedGameId === 'runner3d') {
      return 'Runner 3D';
    }

    return String(normalizedGameId)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function tableMarkup(entries) {
    if (!entries.length) {
      return '<p class="empty-state">' + escapeHtml(t('common.emptyLeaderboard', 'No scores saved yet.')) + '</p>';
    }

    var rows = entries.map(function (entry, index) {
      return [
        '<tr>',
        '  <td><span class="rank-pill">' + (index + 1) + '</span></td>',
        '  <td>' + escapeHtml(entry.playerName || t('common.player', 'Player')) + '</td>',
        '  <td>' + escapeHtml(formatGameLabel(entry.game)) + '</td>',
        '  <td>' + escapeHtml(String(entry.score)) + '</td>',
        '  <td>' + escapeHtml(formatDate(entry.createdAt)) + '</td>',
        '</tr>'
      ].join('');
    }).join('');

    return [
      '<table class="leaderboard-table">',
      '  <thead>',
      '    <tr>',
      '      <th>' + escapeHtml(t('common.position', 'Rank')) + '</th>',
      '      <th>' + escapeHtml(t('common.player', 'Player')) + '</th>',
      '      <th>' + escapeHtml(t('nav.games', 'Game')) + '</th>',
      '      <th>' + escapeHtml(t('leaderboard.labels.score', 'Score')) + '</th>',
      '      <th>' + escapeHtml(t('leaderboard.labels.date', 'Date')) + '</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>' + rows + '</tbody>',
      '</table>'
    ].join('');
  }

  function renderSection(section, title, entries) {
    if (!section) {
      return;
    }

    var titleNode = section.querySelector('[data-leaderboard-title]');
    var countNode = section.querySelector('[data-leaderboard-count]');
    var bodyNode = section.querySelector('[data-leaderboard-body]');

    if (titleNode) {
      titleNode.textContent = title;
    }

    if (countNode) {
      countNode.textContent = String(entries.length);
    }

    if (bodyNode) {
      bodyNode.innerHTML = tableMarkup(entries);
    }
  }

  function gameParam() {
    var params = new URLSearchParams(global.location.search);
    return normalizeGameId(params.get('game'));
  }

  function loadEntries(options) {
    if (!global.Novarena) {
      return Promise.resolve([]);
    }

    if (typeof global.Novarena.getLeaderboardAsync === 'function') {
      return global.Novarena.getLeaderboardAsync(options);
    }

    return Promise.resolve(global.Novarena.getLeaderboard(options));
  }

  async function renderLeaderboard() {
    if (!global.Novarena || typeof global.Novarena.getLeaderboard !== 'function') {
      return;
    }

    var globalSection = document.querySelector('[data-sdk-leaderboard-global]');
    var gameSection = document.querySelector('[data-sdk-leaderboard-game]');
    var selectedGame = gameParam();
    var globalEntries = await loadEntries({ game: null, limit: 10, order: 'desc' });

    renderSection(
      globalSection,
      t('leaderboard.sections.global', 'Global leaderboard'),
      globalEntries
    );

    if (!gameSection) {
      return;
    }

    if (!selectedGame) {
      renderSection(gameSection, t('leaderboard.sections.game', 'Game leaderboard'), []);
      var gameBody = gameSection.querySelector('[data-leaderboard-body]');
      if (gameBody) {
        gameBody.innerHTML = '<p class="empty-state">' + escapeHtml(t('leaderboard.sections.gameHint', 'Open this page with ?game=snake to view a game leaderboard.')) + '</p>';
      }
      return;
    }

    renderSection(
      gameSection,
      formatGameLabel(selectedGame) + ' ' + t('nav.leaderboard', 'Leaderboard'),
      await loadEntries({ game: selectedGame, limit: 10, order: 'desc' })
    );
  }

  global.renderLeaderboard = renderLeaderboard;

  document.addEventListener('DOMContentLoaded', function () {
    renderLeaderboard().catch(function () {
      renderSection(
        document.querySelector('[data-sdk-leaderboard-global]'),
        t('leaderboard.sections.global', 'Global leaderboard'),
        []
      );
      renderSection(
        document.querySelector('[data-sdk-leaderboard-game]'),
        t('leaderboard.sections.game', 'Game leaderboard'),
        []
      );
    });
  });
})(window);
