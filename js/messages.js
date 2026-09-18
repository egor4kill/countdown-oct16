(function () {
  'use strict';

  if (!window.__fbDB) return;

  var db = window.__fbDB;

  var compos = document.getElementById('composer');
  var input = document.getElementById('msg-input');
  var send = document.getElementById('msg-send');
  var rain = document.getElementById('rain');
  var seen = {};
  var knownTexts = {};
  var allMessages = [];
  var order = [];
  var pos = 0;

  function spawnMessage(text) {
    var el = document.createElement('div');
    el.className = 'rain-msg';
    el.textContent = text;

    var size = 16 + Math.floor(Math.random() * 18);
    var left = 2 + Math.random() * 88;
    var duration = 6 + Math.random() * 8;
    var delay = Math.random() * 3;

    el.style.left = left + 'vw';
    el.style.fontSize = size + 'px';
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = delay + 's';

    rain.appendChild(el);
    setTimeout(function () { el.remove(); }, (duration + delay + 1) * 1000);
  }

  function addMessage(text) {
    return db.collection('messages').add({
      text: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  compos.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;

    send.disabled = true;
    addMessage(text)
      .then(function () {
        input.value = '';
        send.disabled = false;
      })
      .catch(function (err) {
        console.error(err);
        alert('Не удалось отправить: ' + err.message);
        send.disabled = false;
      });
  });

  function refillOrder() {
    order = allMessages.slice();
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    pos = 0;
  }

  function spawnOne() {
    if (!allMessages.length) return;
    if (pos >= order.length) refillOrder();
    spawnMessage(order[pos % order.length]);
    pos++;
  }

  function spawnRandom() {
    spawnOne();
    if (Math.random() < 0.6) spawnOne();
  }

  var firstSnapshot = true;

  db.collection('messages')
    .orderBy('createdAt', 'asc')
    .limitToLast(1000)
    .onSnapshot(function (snap) {
      var isFirst = firstSnapshot;
      firstSnapshot = false;

      snap.docChanges().forEach(function (change) {
        if (change.type !== 'added') return;
        var id = change.doc.id;
        if (seen[id]) return;
        seen[id] = true;
        var data = change.doc.data();
        if (!data.text) return;
        if (knownTexts[data.text]) return;
        knownTexts[data.text] = true;
        allMessages.push(data.text);
        if (!isFirst) spawnMessage(data.text);
      });

      if (isFirst) {
        setTimeout(function () {
          for (var j = 0; j < 4; j++) spawnRandom();
        }, 300);
      }
    }, function (err) {
      console.error('listen error', err);
    });

  setInterval(spawnRandom, 1400);
})();