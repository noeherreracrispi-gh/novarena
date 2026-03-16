(function (global) {
  'use strict';

  var LOCALES = {
    ca: 'ca-ES',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT'
  };
  var CHALLENGE_COPY = {
    ca: {
      title: 'Challenge leaderboard',
      empty: 'No hi ha repte actiu ara mateix.',
      summaryPrefix: 'Repte',
      datePrefix: 'Data',
      period: {
        all_time: 'Global',
        today: 'Avui',
        this_week: 'Aquesta setmana'
      }
    },
    es: {
      title: 'Challenge leaderboard',
      empty: 'No hay reto activo ahora mismo.',
      summaryPrefix: 'Reto',
      datePrefix: 'Fecha',
      period: {
        all_time: 'Global',
        today: 'Hoy',
        this_week: 'Esta semana'
      }
    },
    en: {
      title: 'Challenge leaderboard',
      empty: 'There is no active challenge right now.',
      summaryPrefix: 'Challenge',
      datePrefix: 'Date',
      period: {
        all_time: 'Global',
        today: 'Today',
        this_week: 'This week'
      }
    },
    it: {
      title: 'Challenge leaderboard',
      empty: 'Non c\'e una sfida attiva in questo momento.',
      summaryPrefix: 'Sfida',
      datePrefix: 'Data',
      period: {
        all_time: 'Globale',
        today: 'Oggi',
        this_week: 'Questa settimana'
      }
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

  function formatDateOnly(value) {
    var date = value ? new Date(String(value) + 'T00:00:00.000Z') : null;
    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString(LOCALES[currentLanguage()] || 'en-US', {
      dateStyle: 'medium'
    });
  }

  function challengeCopy() {
    return CHALLENGE_COPY[currentLanguage()] || CHALLENGE_COPY.en;
  }

  function periodCopy(period) {
    var copy = challengeCopy();
    return copy.period && copy.period[period] ? copy.period[period] : period;
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

  function challengeParam() {
    var params = new URLSearchParams(global.location.search);
    return params.get('challenge');
  }

  function periodParam() {
    var params = new URLSearchParams(global.location.search);
    var period = params.get('period');
    return ['today', 'this_week'].indexOf(period) >= 0 ? period : 'all_time';
  }

  function bindPeriodControls() {
    var params = new URLSearchParams(global.location.search);
    var selected = periodParam();

    document.querySelectorAll('[data-leaderboard-period-controls] [data-period]').forEach(function (node) {
      var targetPeriod = node.getAttribute('data-period');
      var nextParams = new URLSearchParams(params.toString());

      node.textContent = periodCopy(targetPeriod);

      if (targetPeriod === 'all_time') {
        nextParams.delete('period');
      } else {
        nextParams.set('period', targetPeriod);
      }

      node.setAttribute('href', 'leaderboard.html' + (nextParams.toString() ? '?' + nextParams.toString() : ''));
      node.classList.toggle('button-primary', targetPeriod === selected);
      node.classList.toggle('button-secondary', targetPeriod !== selected);
    });
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

  function loadChallengeEntries(options) {
    if (!global.Novarena) {
      return Promise.resolve({ challenge: null, entries: [] });
    }

    if (typeof global.Novarena.getChallengeLeaderboardAsync === 'function') {
      return global.Novarena.getChallengeLeaderboardAsync(options);
    }

    if (typeof global.Novarena.getChallengeLeaderboard === 'function') {
      return Promise.resolve(global.Novarena.getChallengeLeaderboard(options));
    }

    return Promise.resolve({ challenge: null, entries: [] });
  }

  function renderChallengeSection(section, result) {
    var copy = challengeCopy();
    var titleNode;
    var countNode;
    var bodyNode;
    var summaryNode;
    var challenge = result && result.challenge ? result.challenge : null;
    var entries = result && Array.isArray(result.entries) ? result.entries : [];

    if (!section) {
      return;
    }

    titleNode = section.querySelector('[data-leaderboard-title]');
    countNode = section.querySelector('[data-leaderboard-count]');
    bodyNode = section.querySelector('[data-leaderboard-body]');
    summaryNode = section.parentElement ? section.parentElement.querySelector('[data-challenge-summary]') : null;

    if (titleNode) {
      titleNode.textContent = challenge ? challenge.title : copy.title;
    }

    if (countNode) {
      countNode.textContent = String(entries.length);
    }

    if (summaryNode) {
      summaryNode.textContent = challenge
        ? copy.summaryPrefix + ': ' + challenge.description + ' · ' + formatGameLabel(challenge.game) + ' · ' + copy.datePrefix + ': ' + formatDateOnly(challenge.date)
        : copy.empty;
    }

    if (bodyNode) {
      bodyNode.innerHTML = challenge
        ? tableMarkup(entries)
        : '<p class="empty-state">' + escapeHtml(copy.empty) + '</p>';
    }
  }

  async function renderLeaderboard() {
    if (!global.Novarena || typeof global.Novarena.getLeaderboard !== 'function') {
      return;
    }

    var challengeSection = document.querySelector('[data-sdk-leaderboard-challenge]');
    var globalSection = document.querySelector('[data-sdk-leaderboard-global]');
    var gameSection = document.querySelector('[data-sdk-leaderboard-game]');
    var selectedGame = gameParam();
    var selectedChallenge = challengeParam();
    var selectedPeriod = periodParam();
    var challengeResult = await loadChallengeEntries({ challengeId: selectedChallenge, limit: 10 });
    var globalEntries = await loadEntries({ game: null, limit: 10, order: 'desc', period: selectedPeriod });

    bindPeriodControls();

    renderChallengeSection(challengeSection, challengeResult);

    renderSection(
      globalSection,
      periodCopy(selectedPeriod) + ' ' + t('nav.leaderboard', 'Leaderboard'),
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
      formatGameLabel(selectedGame) + ' ' + periodCopy(selectedPeriod) + ' ' + t('nav.leaderboard', 'Leaderboard'),
      await loadEntries({ game: selectedGame, limit: 10, order: 'desc', period: selectedPeriod })
    );
  }

  global.renderLeaderboard = renderLeaderboard;

  document.addEventListener('DOMContentLoaded', function () {
    renderLeaderboard().catch(function () {
      renderChallengeSection(
        document.querySelector('[data-sdk-leaderboard-challenge]'),
        { challenge: null, entries: [] }
      );
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
