(function () {
  'use strict';

  var START = AppConfig.START_DATETIME;
  var TARGET = AppConfig.TARGET_DATETIME;

  var els = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    ms: document.getElementById('ms'),
    target: document.getElementById('target'),
    percent: document.getElementById('percent'),
    fill: document.getElementById('fill')
  };

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatDate(d) {
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  function updateProgress() {
    var now = Date.now();
    var diff = TARGET.getTime() - now;
    var total = TARGET.getTime() - START.getTime();

    if (diff <= 0) {
      document.body.classList.add('finished');
      return;
    }

    var remaining = Math.max(0, Math.min(100, (diff / total) * 100));
    els.percent.textContent = remaining.toFixed(3) + '%';
    els.fill.style.width = remaining.toFixed(3) + '%';
  }

  function tick() {
    var diff = TARGET.getTime() - Date.now();

    if (diff <= 0) {
      document.body.classList.add('finished');
      return;
    }

    var ms = Math.floor(diff % 1000);
    els.ms.textContent = '.' + String(ms).padStart(3, '0');

    var seconds = Math.floor(diff / 1000);

    els.days.textContent = pad(Math.floor(seconds / 86400));
    els.hours.textContent = pad(Math.floor(seconds / 3600) % 24);
    els.minutes.textContent = pad(Math.floor(seconds / 60) % 60);
    els.seconds.textContent = pad(seconds % 60);
  }

  els.target.textContent = 'Целевая дата (по вашему местному времени): ' + formatDate(TARGET);

  tick();
  setInterval(tick, 40);

  updateProgress();
  setInterval(updateProgress, 100);
})();