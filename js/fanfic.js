(function () {
  'use strict';

  if (!window.__fbDB) return;

  var db = window.__fbDB;
  var list = document.getElementById('fanfic-list');
  if (!list) return;

  function fmtDate(t) {
    if (!t || !t.toDate) return '—';
    return t.toDate().toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function renderMarkdown(md, className) {
    var div = document.createElement('div');
    div.className = className || 'news-body';
    if (window.marked && window.DOMPurify) {
      div.innerHTML = window.DOMPurify.sanitize(window.marked.parse(md));
    } else {
      div.textContent = md;
      if (md.indexOf('\n') !== -1) div.style.whiteSpace = 'pre-wrap';
    }
    return div;
  }

  function openChapter(ch) {
    var overlay = document.createElement('div');
    overlay.className = 'news-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'news-modal';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'news-modal-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', close);

    var num = document.createElement('div');
    num.className = 'stamp stamp-chapter';
    num.textContent = 'Глава ' + ch.number;

    var title = document.createElement('h2');
    title.textContent = ch.title;

    var date = document.createElement('div');
    date.className = 'news-modal-date';
    date.textContent = fmtDate(ch.createdAt);

    modal.appendChild(closeBtn);
    modal.appendChild(num);
    modal.appendChild(title);
    modal.appendChild(date);
    modal.appendChild(renderMarkdown(ch.text || '', 'news-body'));

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey, true);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', onKey, true);
  }

  function buildCard(ch) {
    var card = document.createElement('article');
    card.className = 'news-card';

    var cont = document.createElement('div');
    cont.className = 'news-cont';

    var stamps = document.createElement('div');
    stamps.className = 'news-stamps';
    var num = document.createElement('span');
    num.className = 'stamp stamp-chapter';
    num.textContent = 'Глава ' + ch.number;
    stamps.appendChild(num);
    cont.appendChild(stamps);

    var title = document.createElement('h2');
    title.textContent = ch.title;
    cont.appendChild(title);

    if (ch.text) {
      var teaser = document.createElement('div');
      teaser.className = 'news-teaser';
      teaser.appendChild(renderMarkdown(ch.text, 'news-body'));
      cont.appendChild(teaser);
    }

    var date = document.createElement('div');
    date.className = 'news-meta';
    date.textContent = fmtDate(ch.createdAt);
    cont.appendChild(date);

    card.appendChild(cont);
    card.addEventListener('click', function () {
      openChapter(ch);
    });

    return card;
  }

  db.collection('fanfic')
    .orderBy('number', 'asc')
    .onSnapshot(function (snap) {
      var items = [];
      snap.forEach(function (doc) {
        var data = doc.data();
        if (!data.title) return;
        items.push({
          id: doc.id,
          number: typeof data.number === 'number' ? data.number : 0,
          title: data.title,
          text: data.text,
          createdAt: data.createdAt
        });
      });

      items.sort(function (a, b) { return a.number - b.number; });

      list.innerHTML = '';

      if (!items.length) {
        list.innerHTML = '<div class="empty">Пока нет ни одной главы — фанфик ещё только начинается.</div>';
        return;
      }

      items.forEach(function (ch) {
        list.appendChild(buildCard(ch));
      });
    }, function (err) {
      list.innerHTML = '<div class="empty">Ошибка загрузки: ' + err.message + '</div>';
    });
})();