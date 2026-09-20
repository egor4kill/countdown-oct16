(function () {
  'use strict';

  if (!window.__fbAuth || !window.__fbDB) return;

  var auth = window.__fbAuth;
  var db = window.__fbDB;

  var ADMIN_EMAIL = AppConfig.ADMIN_EMAIL;

  var status = document.getElementById('status');
  var authBox = document.getElementById('auth-box');
  var loginBtn = document.getElementById('login');
  var list = document.getElementById('list');
  var adminEmailEl = document.getElementById('admin-email');

  var newsAdmin = document.getElementById('news-admin');
  var newsTitle = document.getElementById('news-title');
  var newsText = document.getElementById('news-text');
  var newsPublish = document.getElementById('news-publish');
  var newsEditCancel = document.getElementById('news-edit-cancel');
  var newsDraft = document.getElementById('news-draft');
  var newsList = document.getElementById('news-admin-list');
  var newsImgBtn = document.getElementById('news-img-btn');
  var newsImg = document.getElementById('news-img');
  var newsCoverBtn = document.getElementById('news-cover-btn');
  var newsCover = document.getElementById('news-cover');
  var newsCoverBox = document.getElementById('news-cover-box');
  var newsCoverImg = document.getElementById('news-cover-img');
  var newsCoverRemove = document.getElementById('news-cover-remove');
  var newsStatus = document.getElementById('news-status');
  var newsPreviewLabel = document.getElementById('news-preview-label');
  var newsPreviewBox = document.getElementById('news-preview-box');

  var coverUrl = '';

  var editingId = null;
  var DRAFT_KEY = 'news_draft_v1';
  var draftTimer = null;

  function getDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { return null; }
  }

  function setDraftNow() {
    if (newsAdmin.hidden) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title: newsTitle.value,
        text: newsText.value,
        ts: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
  }

  function scheduleDraft() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(setDraftNow, 400);
  }

  function renderDraftBanner() {
    var d = getDraft();
    if (d && !newsAdmin.hidden && (d.title || d.text)) {
      var when = new Date(d.ts).toLocaleString('ru-RU', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      var restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'btn small';
      restore.textContent = 'Восстановить';
      restore.addEventListener('click', function () {
        newsTitle.value = d.title || '';
        newsText.value = d.text || '';
        editingId = null;
        setPublishMode();
        renderLivePreview();
        newsDraft.hidden = true;
      });
      var discard = document.createElement('button');
      discard.type = 'button';
      discard.className = 'btn small ghost';
      discard.textContent = 'Сбросить';
      discard.addEventListener('click', function () {
        clearDraft();
        newsDraft.hidden = true;
      });
      newsDraft.innerHTML = '';
      newsDraft.appendChild(document.createTextNode('Есть черновик от ' + when + ' — '));
      newsDraft.appendChild(restore);
      newsDraft.appendChild(discard);
      newsDraft.hidden = false;
    } else {
      newsDraft.hidden = true;
    }
  }

  function showStatus(text) {
    newsStatus.textContent = text || '';
  }

  function renderLivePreview() {
    var v = newsText.value.trim();
    if (!v) {
      newsPreviewLabel.hidden = true;
      newsPreviewBox.hidden = true;
      newsPreviewBox.innerHTML = '';
      return;
    }
    newsPreviewLabel.hidden = false;
    if (window.marked && window.DOMPurify) {
      newsPreviewBox.innerHTML = window.DOMPurify.sanitize(window.marked.parse(v));
    } else {
      newsPreviewBox.textContent = v;
      newsPreviewBox.style.whiteSpace = 'pre-wrap';
    }
    newsPreviewBox.hidden = false;
  }

  function setPublishMode() {
    newsPublish.textContent = editingId ? 'Сохранить изменения' : 'Опубликовать';
    newsEditCancel.hidden = !editingId;
  }

  function resetEditor() {
    newsTitle.value = '';
    newsText.value = '';
    editingId = null;
    setPublishMode();
    clearDraft();
    newsDraft.hidden = true;
    newsPreviewLabel.hidden = true;
    newsPreviewBox.hidden = true;
    newsPreviewBox.innerHTML = '';
    setCover('');
    showStatus('');
  }

  if (adminEmailEl) adminEmailEl.textContent = ADMIN_EMAIL;

  function fmtDate(t) {
    if (!t) return '—';
    var d = t.toDate();
    return d.toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  var unsubscribe = null;

  function render(messages) {
    list.innerHTML = '';

    if (!messages.length) {
      list.innerHTML = '<div class="empty">Сообщений пока нет.</div>';
      return;
    }

    messages.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'msg';

      var text = document.createElement('div');
      text.className = 'text';
      text.textContent = m.text;

      var date = document.createElement('div');
      date.className = 'date';
      date.textContent = fmtDate(m.createdAt);

      var del = document.createElement('button');
      del.className = 'btn small';
      del.textContent = 'Удалить';
      del.addEventListener('click', function () {
        if (!confirm('Удалить сообщение?')) return;
        db.collection('messages').doc(m.id).delete()
          .catch(function (err) {
            alert('Не удалось: ' + err.message);
          });
      });

      row.appendChild(text);
      row.appendChild(date);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  function startListening() {
    if (unsubscribe) unsubscribe();

    unsubscribe = db.collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(function (snap) {
        var messages = [];
        snap.forEach(function (doc) {
          messages.push({ id: doc.id, text: doc.data().text, createdAt: doc.data().createdAt });
        });
        render(messages);
      }, function (err) {
        status.textContent = 'Ошибка чтения: ' + err.message;
      });
  }

  var newsUnsub = null;

  function renderNews(items) {
    newsList.innerHTML = '';

    if (!items.length) {
      newsList.innerHTML = '<div class="empty">Новостей пока нет.</div>';
      return;
    }

    items.slice().sort(function (a, b) {
      var ap = a.pinned ? 1 : 0;
      var bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap;
      var at = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
      var bt = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    }).forEach(function (n) {
      var row = document.createElement('div');
      row.className = 'news-admin-row';

      var head = document.createElement('div');
      head.className = 'head';
      var pin = document.createElement('span');
      pin.className = 'pin-badge';
      pin.textContent = 'закреплено';
      pin.hidden = !n.pinned;
      var strong = document.createElement('strong');
      strong.textContent = n.title;
      head.appendChild(pin);
      head.appendChild(strong);

      if (n.cover) {
        var thumb = document.createElement('img');
        thumb.className = 'news-cover-thumb';
        thumb.src = n.cover;
        thumb.alt = '';
        head.appendChild(thumb);
      }

      var body = document.createElement('div');
      body.className = 'text';
      body.textContent = n.text || '';
      body.style.maxHeight = '42px';
      body.style.overflow = 'hidden';

      var meta = document.createElement('div');
      meta.className = 'date';
      meta.textContent = fmtDate(n.createdAt);

      var actions = document.createElement('div');
      actions.className = 'row-actions';

      var pinBtn = document.createElement('button');
      pinBtn.className = 'btn small ghost';
      pinBtn.textContent = n.pinned ? 'Открепить' : 'Закрепить';
      pinBtn.addEventListener('click', function () {
        db.collection('news').doc(n.id).update({ pinned: !n.pinned })
          .catch(function (err) { alert('Не удалось: ' + err.message); });
      });

      var editBtn = document.createElement('button');
      editBtn.className = 'btn small';
      editBtn.textContent = 'Изменить';
      editBtn.addEventListener('click', function () {
        editingId = n.id;
        newsTitle.value = n.title || '';
        newsText.value = n.text || '';
        setCover(n.cover || '');
        setPublishMode();
        renderLivePreview();
        clearDraft();
        newsDraft.hidden = true;
        newsTitle.focus();
      });

      var delBtn = document.createElement('button');
      delBtn.className = 'btn small';
      delBtn.textContent = 'Удалить';
      delBtn.addEventListener('click', function () {
        if (!confirm('Удалить новость?')) return;
        db.collection('news').doc(n.id).delete()
          .catch(function (err) { alert('Не удалось: ' + err.message); });
      });

      actions.appendChild(pinBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      row.appendChild(head);
      row.appendChild(body);
      row.appendChild(meta);
      row.appendChild(actions);

      if (editingId === n.id) row.classList.add('editing');

      newsList.appendChild(row);
    });
  }

  function startNewsListening() {
    if (newsUnsub) newsUnsub();

    newsUnsub = db.collection('news')
      .orderBy('createdAt', 'desc')
      .onSnapshot(function (snap) {
        var items = [];
        snap.forEach(function (doc) {
          items.push({
            id: doc.id,
            title: doc.data().title,
            text: doc.data().text,
            createdAt: doc.data().createdAt,
            pinned: doc.data().pinned === true,
            cover: doc.data().cover || ''
          });
        });
        renderNews(items);
      }, function (err) {
        console.error('news listen error', err);
      });
  }

  function stopNews() {
    if (newsUnsub) { newsUnsub(); newsUnsub = null; }
  }

  newsPublish.addEventListener('click', function () {
    var title = newsTitle.value.trim();
    var text = newsText.value.trim();
    if (!title || !text) {
      alert('Заполните заголовок и текст новости.');
      return;
    }

    newsPublish.disabled = true;

    var request;
    if (editingId) {
      request = db.collection('news').doc(editingId).update({ title: title, text: text, cover: coverUrl });
    } else {
      request = db.collection('news').add({
        title: title,
        text: text,
        cover: coverUrl,
        pinned: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    request.then(function () {
      resetEditor();
      newsPublish.disabled = false;
    }).catch(function (err) {
      alert('Не удалось сохранить: ' + err.message);
      newsPublish.disabled = false;
    });
  });

  newsEditCancel.addEventListener('click', function () {
    if (!editingId) { resetEditor(); return; }
    var d = getDraft();
    if (d && (d.title || d.text) && newsText.value === d.text && newsTitle.value === d.title) {
      resetEditor();
    } else {
      newsTitle.value = '';
      newsText.value = '';
      editingId = null;
      setPublishMode();
      setCover('');
      newsPreviewLabel.hidden = true;
      newsPreviewBox.hidden = true;
      newsPreviewBox.innerHTML = '';
      showStatus('');
      renderDraftBanner();
    }
  });

  newsTitle.addEventListener('input', scheduleDraft);
  newsText.addEventListener('input', function () {
    scheduleDraft();
    renderLivePreview();
  });

  newsText.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'b') {
      e.preventDefault();
      wrapSelection('**', '**');
    } else if ((e.ctrlKey || e.metaKey) && k === 'i') {
      e.preventDefault();
      wrapSelection('*', '*');
    } else if ((e.ctrlKey || e.metaKey) && k === 'k') {
      e.preventDefault();
      var url = prompt('Ссылка (https://...)');
      if (url) wrapSelection('[' + url + '](', ')');
    }
  });

  newsText.addEventListener('paste', function (e) {
    var items = (e.clipboardData && e.clipboardData.items) ? e.clipboardData.items : [];
    var file = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type && items[i].type.indexOf('image/') === 0) {
        file = items[i].getAsFile();
        break;
      }
    }
    if (!file) return;
    e.preventDefault();
    showStatus('Загрузка изображения…');
    try {
      uploadImage(file, function (url) {
        insertImageMarkdown(url, 'картинка');
        renderLivePreview();
        showStatus('');
      }, function (err) {
        showError(err);
      });
    } catch (err) {
      showError(err);
    }
  });

  newsText.addEventListener('dragover', function (e) {
    e.preventDefault();
  });

  newsText.addEventListener('drop', function (e) {
    var files = e.dataTransfer ? e.dataTransfer.files : [];
    if (!files.length) return;
    var images = [];
    for (var i = 0; i < files.length; i++) {
      if (files[i].type && files[i].type.indexOf('image/') === 0) images.push(files[i]);
    }
    if (!images.length) return;
    e.preventDefault();
    showStatus('Загрузка изображений…');
    var pending = images.length;
    var firstError = null;
    images.forEach(function (file, idx) {
      try {
        uploadImage(file, function (url) {
          if (idx === 0) newsText.focus();
          insertImageMarkdown(url, (file.name.replace(/\.[^.]+$/, '') || 'фото').replace(/[_\s]+/g, ' '));
          pending--;
          if (pending === 0) { renderLivePreview(); showStatus(firstError ? 'Ошибка: ' + firstError : ''); }
        }, function (err) {
          pending--;
          firstError = firstError || (err && err.message ? err.message : String(err));
          if (pending === 0) { renderLivePreview(); showStatus('Ошибка: ' + firstError); }
          console.error(err);
        });
      } catch (err) {
        pending--;
        firstError = firstError || String(err);
        if (pending === 0) { renderLivePreview(); showStatus('Ошибка: ' + firstError); }
        console.error(err);
      }
    });
  });

  function wrapSelection(before, after) {
    var ta = newsText;
    var s = ta.selectionStart;
    var e = ta.selectionEnd;
    var v = ta.value;
    var sel = v.slice(s, e) || 'текст';
    ta.value = v.slice(0, s) + before + sel + after + v.slice(e);
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = e + before.length;
  }

  function prefixAtCursor(p) {
    var ta = newsText;
    var s = ta.selectionStart;
    var v = ta.value;
    ta.value = v.slice(0, s) + p + v.slice(s);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + p.length;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.news-toolbar .tool'), function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.getAttribute('data-wrap');
      var prefix = btn.getAttribute('data-prefix');
      if (wrap) {
        wrapSelection(wrap, btn.getAttribute('data-close') || wrap);
      } else if (prefix) {
        prefixAtCursor(prefix);
      } else if (btn.getAttribute('data-link')) {
        var url = prompt('Ссылка (https://...)');
        if (!url) return;
        wrapSelection('[' + url + '](', ')');
      }
    });
  });

  function insertImageMarkdown(url, alt) {
    prefixAtCursor('![' + alt + '](' + url + ')');
  }

  function uploadImage(file, done, fail) {
    if (!file.type || file.type.indexOf('image/') !== 0) {
      return fail(new Error('Нужен файл изображения.'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return fail(new Error('Картинка больше 5 МБ.'));
    }
    var key = AppConfig.IMGBB_KEY;
    if (!key || key === 'YOUR_IMGBB_KEY_HERE') {
      return fail(new Error('Не задан ключ ImgBB в js/config.js (поле IMGBB_KEY).'));
    }
    var fd = new FormData();
    fd.append('image', file);
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 90000);
    fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), {
      method: 'POST',
      body: fd,
      signal: ctrl.signal
    }).then(function (res) {
      return res.json();
    }).then(function (json) {
      clearTimeout(timer);
      if (json && json.data && json.data.url) {
        done(json.data.url);
      } else {
        var msg = json && json.error && json.error.message ? json.error.message : 'Неизвестная ошибка ImgBB.';
        fail(new Error(msg));
      }
    }).catch(function (err) {
      clearTimeout(timer);
      fail((err && err.name === 'AbortError')
        ? new Error('Таймаут загрузки (90 с). Проверьте интернет.')
        : err);
    });
  }

  newsImgBtn.addEventListener('click', function () {
    newsImg.click();
  });

  newsImg.addEventListener('change', function () {
    var file = newsImg.files && newsImg.files[0];
    if (!file) return;
    newsImgBtn.disabled = true;
    newsImgBtn.textContent = 'Загрузка…';
    try {
      uploadImage(file, function (url) {
        var alt = (file.name.replace(/\.[^.]+$/, '') || 'фото').replace(/[_\s]+/g, ' ');
        insertImageMarkdown(url, alt);
        renderLivePreview();
        newsImgBtn.disabled = false;
        newsImgBtn.textContent = 'Картинка';
        newsImg.value = '';
        showStatus('');
      }, function (err) {
        newsImgBtn.disabled = false;
        newsImgBtn.textContent = 'Картинка';
        newsImg.value = '';
        showError(err);
      });
    } catch (err) {
      newsImgBtn.disabled = false;
      newsImgBtn.textContent = 'Картинка';
      newsImg.value = '';
      showError(err);
    }
  });

  function syncCoverPreview() {
    if (coverUrl) {
      newsCoverImg.src = coverUrl;
      newsCoverBox.hidden = false;
    } else {
      newsCoverImg.removeAttribute('src');
      newsCoverBox.hidden = true;
    }
  }

  function setCover(url) {
    coverUrl = url || '';
    syncCoverPreview();
  }

  newsCoverBtn.addEventListener('click', function () {
    newsCover.click();
  });

  newsCover.addEventListener('change', function () {
    var file = newsCover.files && newsCover.files[0];
    if (!file) return;
    newsCoverBtn.disabled = true;
    newsCoverBtn.textContent = 'Загрузка…';
    showStatus('Загрузка обложки…');
    try {
      uploadImage(file, function (url) {
        setCover(url);
        newsCoverBtn.disabled = false;
        newsCoverBtn.textContent = 'Обложка';
        newsCover.value = '';
        showStatus('');
      }, function (err) {
        newsCoverBtn.disabled = false;
        newsCoverBtn.textContent = 'Обложка';
        newsCover.value = '';
        showError(err);
      });
    } catch (err) {
      newsCoverBtn.disabled = false;
      newsCoverBtn.textContent = 'Обложка';
      newsCover.value = '';
      showError(err);
    }
  });

  newsCoverRemove.addEventListener('click', function () {
    setCover('');
    showStatus('');
  });

  function showError(err) {
    var msg = (err && err.message) ? err.message : String(err);
    showStatus('Ошибка: ' + msg);
    console.error(err);
  }

  function updateUser(user) {
    if (user && user.email === ADMIN_EMAIL) {
      status.textContent = 'Вы вошли как ' + user.email + ' — можно удалять.';
      authBox.hidden = true;
      startListening();
      newsAdmin.hidden = false;
      startNewsListening();
      renderDraftBanner();
    } else if (user) {
      status.textContent = 'Вы вошли как ' + (user.email || '?') + ' — недостаточно прав.';
      authBox.hidden = true;
      list.innerHTML = '<div class="access">Доступ только для ' + ADMIN_EMAIL + '.</div>';
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
      newsAdmin.hidden = true;
      stopNews();
    } else {
      status.textContent = 'Войдите для просмотра и удаления сообщений.';
      authBox.hidden = false;
      list.innerHTML = '';
      newsAdmin.hidden = true;
      stopNews();
    }
  }

  loginBtn.addEventListener('click', function () {
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function (err) {
      status.textContent = 'Ошибка входа: ' + err.message;
    });
  });

  auth.onAuthStateChanged(function (user) {
    updateUser(user);
  });
})();