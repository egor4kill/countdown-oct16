(function () {
  'use strict';

  var grid = document.getElementById('cal-grid');
  var title = document.getElementById('cal-title');
  var prevBtn = document.getElementById('cal-prev');
  var nextBtn = document.getElementById('cal-next');
  if (!grid || !title || !prevBtn || !nextBtn) return;

  var months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  var START = AppConfig.START_DATETIME;
  var TARGET = AppConfig.TARGET_DATETIME;

  var END_YEAR = TARGET.getFullYear();
  var END_MONTH = TARGET.getMonth();
  var END_DAY = TARGET.getDate();

  var startMonthDays = new Date(START.getFullYear(), START.getMonth() + 1, 0).getDate();

  var viewMonths = [
    { y: START.getFullYear(), m: START.getMonth(), from: START.getDate(), to: startMonthDays },
    { y: TARGET.getFullYear(), m: TARGET.getMonth(), from: 1, to: TARGET.getDate() }
  ];

  function isPast(y, m, d) {
    var now = new Date();
    var cy = now.getFullYear();
    var cm = now.getMonth();
    var cd = now.getDate();
    if (y < cy) return true;
    if (y > cy) return false;
    if (m < cm) return true;
    if (m > cm) return false;
    return d < cd;
  }

  function isToday(y, m, d) {
    var now = new Date();
    return y === now.getFullYear() &&
      m === now.getMonth() &&
      d === now.getDate();
  }

  var idx = (function () {
    var now = new Date();
    for (var i = 0; i < viewMonths.length; i++) {
      var vm = viewMonths[i];
      if (now.getFullYear() === vm.y && now.getMonth() === vm.m) return i;
    }
    return 0;
  })();

  function emptyCell() {
    var c = document.createElement('div');
    c.className = 'cal-cell empty';
    return c;
  }

  function render() {
    var vm = viewMonths[idx];
    var y = vm.y;
    var m = vm.m;

    title.textContent = months[m] + ' ' + y;
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= viewMonths.length - 1;

    grid.innerHTML = '';

    var firstDay = Math.max(1, vm.from);
    var lastDay = Math.min(new Date(y, m + 1, 0).getDate(), vm.to);
    var leading = (new Date(y, m, firstDay).getDay() + 6) % 7;

    for (var i = 0; i < leading; i++) {
      grid.appendChild(emptyCell());
    }

    for (var d = firstDay; d <= lastDay; d++) {
      var cell = document.createElement('div');
      var cls = 'cal-cell';
      if (isPast(y, m, d)) {
        cls += ' past';
      } else if (isToday(y, m, d)) {
        cls += ' today';
      } else if (y === END_YEAR && m === END_MONTH && d === END_DAY) {
        cls += ' target';
      }
      cell.className = cls;
      cell.textContent = d;
      grid.appendChild(cell);
    }

    var rem = grid.children.length % 7;
    if (rem) {
      for (var j = 0; j < 7 - rem; j++) {
        grid.appendChild(emptyCell());
      }
    }
  }

  prevBtn.addEventListener('click', function () {
    if (idx > 0) { idx--; render(); }
  });

  nextBtn.addEventListener('click', function () {
    if (idx < viewMonths.length - 1) { idx++; render(); }
  });

  render();
})();