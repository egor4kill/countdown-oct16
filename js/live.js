(function () {
  'use strict';

  var current = window.SITE_VERSION;

  function check() {
    var s = document.createElement('script');
    s.src = 'js/version.js?t=' + Date.now();
    s.onload = function () {
      if (window.SITE_VERSION && window.SITE_VERSION !== current) {
        location.reload();
      }
    };
    document.head.appendChild(s);
  }

  setInterval(check, 30000);
})();