(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = {
    timer: document.getElementById('tab-timer'),
    news: document.getElementById('tab-news')
  };

  function activate(name) {
    tabs.forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === name);
    });
    var keys = Object.keys(panels);
    for (var i = 0; i < keys.length; i++) {
      panels[keys[i]].hidden = keys[i] !== name;
    }
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activate(t.getAttribute('data-tab'));
    });
  });
})();