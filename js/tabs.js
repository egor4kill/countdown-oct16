(function () {
  'use strict';

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = {};
  tabs.forEach(function (t) {
    var name = t.getAttribute('data-tab');
    panels[name] = document.getElementById('tab-' + name);
  });

  function activate(name) {
    tabs.forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === name);
    });
    var keys = Object.keys(panels);
    for (var i = 0; i < keys.length; i++) {
      if (panels[keys[i]]) panels[keys[i]].hidden = keys[i] !== name;
    }
  }

  if (!Object.values(panels).some(function (p) { return p; })) return;

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activate(t.getAttribute('data-tab'));
    });
  });
})();