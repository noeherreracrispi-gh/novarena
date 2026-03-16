(function (global) {
  'use strict';

  var COPY = {
    ca: {
      title: 'Activitat recent',
      subtitle: 'Segueix les darreres puntuacions de la plataforma a mesura que arriben.',
      section: 'Scores recents',
      empty: 'Encara no hi ha activitat recent.',
      latest: 'Ultimes',
      today: 'Avui',
      thisWeek: 'Aquesta setmana',
      points: 'punts',
      player: 'Jugador',
      game: 'Joc',
      score: 'Puntuacio',
      when: 'Quan',
      play: 'Jugar'
    },
    es: {
      title: 'Actividad reciente',
      subtitle: 'Sigue las ultimas puntuaciones de la plataforma a medida que llegan.',
      section: 'Scores recientes',
      empty: 'Todavia no hay actividad reciente.',
      latest: 'Ultimas',
      today: 'Hoy',
      thisWeek: 'Esta semana',
      points: 'puntos',
      player: 'Jugador',
      game: 'Juego',
      score: 'Puntuacion',
      when: 'Cuando',
      play: 'Jugar'
    },
    en: {
      title: 'Recent activity',
      subtitle: 'Follow the latest platform scores as they come in.',
      section: 'Recent scores',
      empty: 'There is no recent activity yet.',
      latest: 'Latest',
      today: 'Today',
      thisWeek: 'This week',
      points: 'points',
      player: 'Player',
      game: 'Game',
      score: 'Score',
      when: 'When',
      play: 'Play'
    },
    it: {
      title: 'Attivita recente',
      subtitle: 'Segui gli ultimi punteggi della piattaforma mentre arrivano.',
      section: 'Score recenti',
      empty: 'Non c\'e ancora attivita recente.',
      latest: 'Ultime',
      today: 'Oggi',
      thisWeek: 'Questa settimana',
      points: 'punti',
      player: 'Giocatore',
      game: 'Gioco',
      score: 'Punteggio',
      when: 'Quando',
      play: 'Gioca'
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

  function pageCopy() {
    return COPY[currentLanguage()] || COPY.en;
  }

  function relativeTime(value) {
    var locales = { ca: 'ca-ES', es: 'es-ES', en: 'en-US', it: 'it-IT' };
    var date = value ? new Date(value) : null;
    var formatter;
    var minutes;
    var hours;
    var days;

    if (!date || Number.isNaN(date.getTime())) {
      return '-';
    }

    formatter = typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function'
      ? new Intl.RelativeTimeFormat(locales[currentLanguage()] || 'en-US', { numeric: 'auto' })
      : null;

    if (!formatter) {
      return date.toLocaleString(locales[currentLanguage()] || 'en-US');
    }

    minutes = Math.round((date.getTime() - Date.now()) / 60000);
    hours = Math.round(minutes / 60);
    days = Math.round(hours / 24);

    if (Math.abs(minutes) < 60) {
      return formatter.format(minutes, 'minute');
    }

    if (Math.abs(hours) < 24) {
      return formatter.format(hours, 'hour');
    }

    return formatter.format(days, 'day');
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

  async function loadGameContexts(items) {
    var ids = Array.from(new Set((items || []).map(function (item) {
      return item && item.game;
    }).filter(Boolean)));
    var contexts = {};

    if (!global.Novarena || typeof global.Novarena.getGameContext !== 'function') {
      return contexts;
    }

    await Promise.all(ids.map(function (gameId) {
      return global.Novarena.getGameContext(gameId).then(function (context) {
        contexts[gameId] = context || null;
      }).catch(function () {
        contexts[gameId] = null;
      });
    }));

    return contexts;
  }

  function itemMarkup(item, contexts) {
    var copy = pageCopy();
    var path = gamePath(item.game, contexts);

    return [
      '<article class="activity-item">',
      '  <strong>' + escapeHtml(item.playerName || copy.player) + ' - ' + escapeHtml(gameLabel(item.game, contexts)) + ' - ' + escapeHtml(String(item.score)) + ' ' + escapeHtml(copy.points) + '</strong>',
      '  <p><a href="' + escapeHtml(path) + '">' + escapeHtml(copy.play) + ' ' + escapeHtml(gameLabel(item.game, contexts)) + '</a></p>',
      '  <div class="activity-meta">' + escapeHtml(relativeTime(item.createdAt)) + '</div>',
      '</article>'
    ].join('');
  }

  function gameParam() {
    var params = new URLSearchParams(global.location.search);
    return params.get('game');
  }

  function periodParam() {
    var params = new URLSearchParams(global.location.search);
    var period = params.get('period');
    return ['today', 'this_week'].indexOf(period) >= 0 ? period : 'latest';
  }

  function bindPeriodControls() {
    var params = new URLSearchParams(global.location.search);
    var selected = periodParam();
    var copy = pageCopy();

    document.querySelectorAll('[data-activity-period-controls] [data-period]').forEach(function (node) {
      var targetPeriod = node.getAttribute('data-period');
      var nextParams = new URLSearchParams(params.toString());

      node.textContent = targetPeriod === 'today'
        ? copy.today
        : (targetPeriod === 'this_week' ? copy.thisWeek : copy.latest);

      if (targetPeriod === 'latest') {
        nextParams.delete('period');
      } else {
        nextParams.set('period', targetPeriod);
      }

      node.setAttribute('href', 'activity.html' + (nextParams.toString() ? '?' + nextParams.toString() : ''));
      node.classList.toggle('button-primary', targetPeriod === selected);
      node.classList.toggle('button-secondary', targetPeriod !== selected);
    });
  }

  async function renderActivityPage() {
    var shell = document.querySelector('[data-activity-feed]');
    var countNode = document.querySelector('[data-activity-count]');
    var titleNode = document.querySelector('[data-activity-title]');
    var subtitleNode = document.querySelector('[data-activity-subtitle]');
    var sectionTitleNode = document.querySelector('[data-activity-section-title]');
    var copy = pageCopy();
    var items;
    var contexts;
    var period = periodParam();

    if (!shell) {
      return;
    }

    if (titleNode) {
      titleNode.textContent = copy.title;
    }

    if (subtitleNode) {
      subtitleNode.textContent = copy.subtitle;
    }

    if (sectionTitleNode) {
      sectionTitleNode.textContent = copy.section;
    }

    bindPeriodControls();

    if (!global.Novarena || typeof global.Novarena.getActivityAsync !== 'function') {
      shell.innerHTML = '<p class="empty-state">' + escapeHtml(copy.empty) + '</p>';
      return;
    }

    items = await global.Novarena.getActivityAsync({
      limit: 20,
      game: gameParam(),
      period: period
    });
    contexts = await loadGameContexts(items);

    if (countNode) {
      countNode.textContent = String(items.length);
    }

    if (!items.length) {
      shell.innerHTML = '<p class="empty-state">' + escapeHtml(copy.empty) + '</p>';
      return;
    }

    shell.innerHTML = items.map(function (item) {
      return itemMarkup(item, contexts);
    }).join('');
  }

  global.renderActivityPage = renderActivityPage;

  document.addEventListener('DOMContentLoaded', function () {
    renderActivityPage();
  });
})(window);
