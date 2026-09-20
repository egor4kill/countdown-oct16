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

  function fmtDateShort(t) {
    if (!t || !t.toDate) return '—';
    return t.toDate().toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short'
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

  function makeStamp(label, cls) {
    var s = document.createElement('span');
    s.className = 'stamp ' + cls;
    s.textContent = label;
    return s;
  }

  function openModal(news) {
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

    var title = document.createElement('h2');
    title.textContent = news.title;

    var date = document.createElement('div');
    date.className = 'news-modal-date';
    date.textContent = fmtDate(news.createdAt);

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(date);
    modal.appendChild(renderMarkdown(news.text || '', 'news-body'));

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

  function buildCard(news) {
    var card = document.createElement('article');
    card.className = 'news-card' + (news.pinned ? ' pinned' : '') + (news.cover ? ' has-cover' : '');

    var stamps = null;

    if (news.cover) {
      var coverWrap = document.createElement('div');
      coverWrap.className = 'news-cover';
      var img = document.createElement('img');
      img.src = news.cover;
      img.alt = '';
      img.loading = 'lazy';
      coverWrap.appendChild(img);
      if (news.pinned || news.cover) {
        stamps = document.createElement('div');
        stamps.className = 'news-stamps';
        if (news.pinned) stamps.appendChild(makeStamp('Срочно', 'stamp-srochno'));
        if (news.cover) stamps.appendChild(makeStamp('Фото', 'stamp-photo'));
        coverWrap.appendChild(stamps);
      }
      card.appendChild(coverWrap);
    }

    var cont = document.createElement('div');
    cont.className = 'news-cont';

    if (!stamps && (news.pinned || news.cover)) {
      stamps = document.createElement('div');
      stamps.className = 'news-stamps';
      if (news.pinned) stamps.appendChild(makeStamp('Срочно', 'stamp-srochno'));
      if (news.cover) stamps.appendChild(makeStamp('Фото', 'stamp-photo'));
      cont.appendChild(stamps);
    }

    var title = document.createElement('h2');
    title.textContent = news.title;
    cont.appendChild(title);

    if (news.text) {
      var teaser = document.createElement('div');
      teaser.className = 'news-teaser';
      teaser.appendChild(renderMarkdown(news.text, 'news-body'));
      cont.appendChild(teaser);
    }

    var date = document.createElement('div');
    date.className = 'news-meta';
    date.textContent = fmtDateShort(news.createdAt) + (news.pinned ? ' · закреплено' : '');
    cont.appendChild(date);

    card.appendChild(cont);

    card.addEventListener('click', function () {
      openModal(news);
    });

    return card;
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
          pinned: data.pinned === true,
          cover: data.cover || ''
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
        list.appendChild(buildCard(news));
      });
    }, function (err) {
      list.innerHTML = '<div class="empty">Ошибка загрузки: ' + err.message + '</div>';
    });
})();