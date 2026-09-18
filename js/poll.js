(function () {
  'use strict';

  if (!window.__fbAuth || !window.__fbDB || !window.AppConfig) return;

  var auth = window.__fbAuth;
  var db = window.__fbDB;

  var root = document.getElementById('poll');
  if (!root) return;

  var question = document.getElementById('poll-question');
  var optionsBox = document.getElementById('poll-options');
  var hint = document.getElementById('poll-hint');

  var OPTIONS = AppConfig.POLL.OPTIONS;
  question.textContent = AppConfig.POLL.QUESTION;

  var uid = null;
  var myOption = null;
  var counts = {};
  var total = 0;
  var votes = {};

  function pct(id) {
    if (!total) return 0;
    return ((counts[id] || 0) / total) * 100;
  }

  function render() {
    optionsBox.innerHTML = '';

    OPTIONS.forEach(function (opt) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'poll-option' + (myOption === opt.id ? ' chosen' : '');

      var bar = document.createElement('span');
      bar.className = 'poll-bar';
      bar.style.width = pct(opt.id).toFixed(1) + '%';

      var label = document.createElement('span');
      label.className = 'poll-label';
      label.textContent = opt.label;

      var num = document.createElement('span');
      num.className = 'poll-num';
      num.textContent = String(counts[opt.id] || 0);

      row.appendChild(bar);
      row.appendChild(label);
      row.appendChild(num);

      row.addEventListener('click', function () {
        if (!uid) return;
        vote(opt.id);
      });

      optionsBox.appendChild(row);
    });

    hint.textContent = uid
      ? (myOption ? 'Ваш голос учтён — можно изменить.' : 'Выберите вариант.')
      : 'Подключаемся…';
  }

  function vote(id) {
    var ref = db.collection('poll_votes').doc(uid);
    ref.set({ option: id })
      .catch(function (err) {
        console.error(err);
        hint.textContent = 'Не удалось проголосовать: ' + err.message;
      });
  }

  function applyMyVote() {
    myOption = uid ? (votes[uid] || null) : null;
  }

  auth.onAuthStateChanged(function (user) {
    uid = user && user.uid ? user.uid : null;
    if (uid) {
      applyMyVote();
      render();
    } else {
      auth.signInAnonymously().catch(function (err) {
        console.error('anon signin', err);
        if (err.code === 'auth/operation-not-allowed') {
          root.hidden = true;
        } else {
          hint.textContent = 'Голосование недоступно: ' + err.message;
        }
      });
    }
  });

  db.collection('poll_votes').onSnapshot(function (snap) {
    votes = {};
    counts = {};
    total = 0;
    snap.forEach(function (doc) {
      var data = doc.data();
      if (!data.option || !OPTIONS.some(function (o) { return o.id === data.option; })) return;
      votes[doc.id] = data.option;
      counts[data.option] = (counts[data.option] || 0) + 1;
      total++;
    });
    applyMyVote();
    render();
  }, function (err) {
    console.error('poll listen error', err);
  });
})();