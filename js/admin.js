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

  function updateUser(user) {
    if (user && user.email === ADMIN_EMAIL) {
      status.textContent = 'Вы вошли как ' + user.email + ' — можно удалять.';
      authBox.hidden = true;
      startListening();
    } else if (user) {
      status.textContent = 'Вы вошли как ' + (user.email || '?') + ' — недостаточно прав.';
      authBox.hidden = true;
      list.innerHTML = '<div class="access">Доступ только для ' + ADMIN_EMAIL + '.</div>';
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    } else {
      status.textContent = 'Войдите для просмотра и удаления сообщений.';
      authBox.hidden = false;
      list.innerHTML = '';
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