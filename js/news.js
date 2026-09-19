(function () {
  'use strict';

  if (!window.__fbDB) return;

  var db = window.__fbDB;
  var list = document.getElementById('news-list');
  if (!list) return;

  function fmtDate(t) {
    if (!t || !t.toDate) return '—';
    return t.toDate().toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  db.collection('news')
    .orderBy('createdAt', 'desc')
    .onSnapshot(function (snap) {
      list.innerHTML = '';

      if (snap.empty) {
        list.innerHTML = '<div class="empty">Новостей пока нет.</div>';
        return;
      }

      snap.forEach(function (doc) {
        var data = doc.data();
        if (!data.title) return;

        var card = document.createElement('article');
        card.className = 'news-card';

        var date = document.createElement('div');
        date.className = 'news-date';
        date.textContent = fmtDate(data.createdAt);

        var title = document.createElement('h2');
        title.textContent = data.title;

        card.appendChild(date);
        card.appendChild(title);

        if (data.text) {
          var p = document.createElement('p');
          p.textContent = data.text;
          card.appendChild(p);
        }

        list.appendChild(card);
      });
    }, function (err) {
      list.innerHTML = '<div class="empty">Ошибка загрузки: ' + err.message + '</div>';
    });
})();