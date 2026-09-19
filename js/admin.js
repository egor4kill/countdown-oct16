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
  var newsList = document.getElementById('news-admin-list');
  var newsImgBtn = document.getElementById('news-img-btn');
  var newsImg = document.getElementById('news-img');
  var newsPreviewBtn = document.getElementById('news-preview-btn');
  var newsPreviewBox = document.getElementById('news-preview-box');

  var storage = window.__fbStorage || null;

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

    items.forEach(function (n) {
      var row = document.createElement('div');
      row.className = 'msg news-row';

      var text = document.createElement('div');
      text.className = 'text';
      var strong = document.createElement('strong');
      strong.textContent = n.title;
      var body = document.createElement('div');
      body.textContent = n.text;
      text.appendChild(strong);
      text.appendChild(document.createElement('br'));
      text.appendChild(body);

      var date = document.createElement('div');
      date.className = 'date';
      date.textContent = fmtDate(n.createdAt);

      var del = document.createElement('button');
      del.className = 'btn small';
      del.textContent = 'Удалить';
      del.addEventListener('click', function () {
        if (!confirm('Удалить новость?')) return;
        db.collection('news').doc(n.id).delete()
          .catch(function (err) {
            alert('Не удалось: ' + err.message);
          });
      });

      row.appendChild(text);
      row.appendChild(date);
      row.appendChild(del);
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
          items.push({ id: doc.id, title: doc.data().title, text: doc.data().text, createdAt: doc.data().createdAt });
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
    db.collection('news').add({
      title: title,
      text: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      newsTitle.value = '';
      newsText.value = '';
      newsPublish.disabled = false;
    }).catch(function (err) {
      alert('Не удалось опубликовать: ' + err.message);
      newsPublish.disabled = false;
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
    if (!storage) return fail(new Error('Хранилище не подключено.'));
    if (!file.type || file.type.indexOf('image/') !== 0) {
      return fail(new Error('Нужен файл изображения.'));
    }
    if (file.size > 5 * 1024 * 1024) {
      return fail(new Error('Картинка больше 5 МБ.'));
    }
    var ref = storage.ref('news_images/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_'));
    ref.put(file).then(function () {
      return ref.getDownloadURL();
    }).then(function (url) {
      done(url);
    }).catch(function (err) {
      fail(err);
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
    uploadImage(file, function (url) {
      var alt = (file.name.replace(/\.[^.]+$/, '') || 'фото').replace(/[_\s]+/g, ' ');
      insertImageMarkdown(url, alt);
      newsImgBtn.disabled = false;
      newsImgBtn.textContent = 'Картинка';
      newsImg.value = '';
    }, function (err) {
      alert('Не удалось загрузить: ' + err.message);
      newsImgBtn.disabled = false;
      newsImgBtn.textContent = 'Картинка';
      newsImg.value = '';
    });
  });

  newsPreviewBtn.addEventListener('click', function () {
    var v = newsText.value.trim();
    if (!v) { newsPreviewBox.innerHTML = '<em>Пусто.</em>'; }
    else if (window.marked && window.DOMPurify) {
      newsPreviewBox.innerHTML = window.DOMPurify.sanitize(window.marked.parse(v));
    } else {
      newsPreviewBox.textContent = v;
    }
    newsPreviewBox.hidden = !newsPreviewBox.hidden;
  });

  function updateUser(user) {
    if (user && user.email === ADMIN_EMAIL) {
      status.textContent = 'Вы вошли как ' + user.email + ' — можно удалять.';
      authBox.hidden = true;
      startListening();
      newsAdmin.hidden = false;
      startNewsListening();
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