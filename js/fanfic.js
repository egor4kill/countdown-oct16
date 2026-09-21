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
  var curEl = null;
  var totEl = null;
  var dotsEl = null;

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

    curEl.innerHTML = current + 1 < 10 ? '<em>0' + (current + 1) + '</em>' : '<em>' + (current + 1) + '</em>';
    totEl.textContent = 'из ' + chapters.length;

    if (dotsEl) {
      for (var i = 0; i < dotsEl.children.length; i++) {
        dotsEl.children[i].className = i <= current ? 'on' : '';
      }
    }
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

    var navRow = document.createElement('div');
    navRow.className = 'fanfic-nav-row';

    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '← Предыдущая';

    var count = document.createElement('span');
    count.className = 'page-count';
    curEl = document.createElement('span');
    curEl.className = 'cur';
    totEl = document.createElement('span');
    totEl.className = 'tot';
    count.appendChild(curEl);
    count.appendChild(totEl);

    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = 'Следующая →';

    prevBtn.addEventListener('click', function () {
      renderChapter(current - 1);
    });
    nextBtn.addEventListener('click', function () {
      renderChapter(current + 1);
    });

    navRow.appendChild(prevBtn);
    navRow.appendChild(count);
    navRow.appendChild(nextBtn);
    nav.appendChild(navRow);

    if (chapters.length > 1) {
      dotsEl = document.createElement('div');
      dotsEl.className = 'fanfic-dots';
      for (var i = 0; i < chapters.length; i++) {
        var dot = document.createElement('span');
        dot.setAttribute('title', 'Глава ' + chapters[i].number);
        dotsEl.appendChild(dot);
      }
      nav.appendChild(dotsEl);
    } else {
      dotsEl = null;
    }

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