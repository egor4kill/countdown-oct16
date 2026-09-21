(function () {
  'use strict';

  if (!window.__fbDB) return;

  var db = window.__fbDB;
  var list = document.getElementById('fanfic-list');
  if (!list) return;

  var chapters = [];
  var current = -1;
  var overlay = null;
  var modalBody = null;
  var prevBtn = null;
  var nextBtn = null;
  var countEl = null;

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

  function closeReader() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(e) {
    if (!overlay) return;
    if (e.key === 'Escape') {
      closeReader();
    } else if (e.key === 'ArrowLeft' && current > 0) {
      renderChapter(current - 1);
    } else if (e.key === 'ArrowRight' && current < chapters.length - 1) {
      renderChapter(current + 1);
    }
  }

  function renderChapter(idx) {
    if (idx < 0 || idx >= chapters.length) return;
    current = idx;
    var ch = chapters[idx];

    modalBody.innerHTML = '';

    var num = document.createElement('div');
    num.className = 'stamp stamp-chapter';
    num.textContent = 'Глава ' + ch.number;

    var title = document.createElement('h2');
    title.textContent = ch.title;

    var date = document.createElement('div');
    date.className = 'news-modal-date';
    date.textContent = fmtDate(ch.createdAt);

    modalBody.appendChild(num);
    modalBody.appendChild(title);
    modalBody.appendChild(date);
    modalBody.appendChild(renderMarkdown(ch.text || '', 'news-body'));

    prevBtn.disabled = current <= 0;
    nextBtn.disabled = current >= chapters.length - 1;
    countEl.textContent = (current + 1) + ' из ' + chapters.length;
  }

  function openReader(startIdx) {
    if (!chapters.length) return;
    closeReader();

    overlay = document.createElement('div');
    overlay.className = 'news-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'news-modal fanfic-reader';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'news-modal-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeReader);

    modalBody = document.createElement('div');

    var nav = document.createElement('div');
    nav.className = 'fanfic-nav';

    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '← предыдущая';

    countEl = document.createElement('span');
    countEl.className = 'page-count';

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'следующая →';

    prevBtn.addEventListener('click', function () {
      renderChapter(current - 1);
    });
    nextBtn.addEventListener('click', function () {
      renderChapter(current + 1);
    });

    nav.appendChild(prevBtn);
    nav.appendChild(countEl);
    nav.appendChild(nextBtn);

    modal.appendChild(closeBtn);
    modal.appendChild(modalBody);
    modal.appendChild(nav);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeReader();
    });
    document.addEventListener('keydown', onKey, true);

    renderChapter(startIdx);
  }

  function buildCard(ch, idx) {
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
      openReader(idx);
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
      chapters = items;

      list.innerHTML = '';

      if (!items.length) {
        list.innerHTML = '<div class="empty">Пока нет ни одной главы — фанфик ещё только начинается.</div>';
        return;
      }

      items.forEach(function (ch, i) {
        list.appendChild(buildCard(ch, i));
      });
    }, function (err) {
      list.innerHTML = '<div class="empty">Ошибка загрузки: ' + err.message + '</div>';
    });
})();