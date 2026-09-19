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

  function renderMarkdown(md) {
    var div = document.createElement('div');
    div.className = 'news-body';
    if (window.marked && window.DOMPurify) {
      div.innerHTML = window.DOMPurify.sanitize(window.marked.parse(md));
    } else {
      div.textContent = md;
      if (md.indexOf('\n') !== -1) div.style.whiteSpace = 'pre-wrap';
    }
    return div;
  }

  db.collection('news')
    .orderBy('createdAt', 'desc')
    .onSnapshot(function (snap) {
      var items = [];
      snap.forEach(function (doc) {
        var data = doc.data();
        if (!data.title) return;
        items.push({
          id: doc.id,
          title: data.title,
          text: data.text,
          createdAt: data.createdAt,
          pinned: data.pinned === true
        });
      });

      items.sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        var at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        var bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });

      list.innerHTML = '';

      if (!items.length) {
        list.innerHTML = '<div class="empty">Новостей пока нет.</div>';
        return;
      }

      items.forEach(function (news) {
        var card = document.createElement('article');
        card.className = 'news-card' + (news.pinned ? ' pinned' : '');

        var date = document.createElement('div');
        date.className = 'news-date';
        date.textContent = fmtDate(news.createdAt);
        if (news.pinned) {
          var pinBadge = document.createElement('span');
          pinBadge.className = 'pin-badge';
          pinBadge.textContent = 'закреплено';
          date.appendChild(pinBadge);
        }

        var title = document.createElement('h2');
        title.textContent = news.title;

        card.appendChild(date);
        card.appendChild(title);

        if (news.text) {
          card.appendChild(renderMarkdown(news.text));
        }

        list.appendChild(card);
      });
    }, function (err) {
      list.innerHTML = '<div class="empty">Ошибка загрузки: ' + err.message + '</div>';
    });
})();