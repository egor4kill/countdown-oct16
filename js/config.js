(function () {
  'use strict';

  // Общие настройки сайта. Таймер идёт с 16 сентября 2026 по 16 октября 2026.
  window.AppConfig = {
    START_DATETIME: new Date(2026, 8, 16, 0, 0, 0, 0),   /* 16 сентября 2026, 00:00:00 */
    TARGET_DATETIME: new Date(2026, 9, 16, 23, 59, 59, 0), /* 16 октября 2026, 23:59:59 */
    ADMIN_EMAIL: 'egorgubarenko8@gmail.com',

    FIREBASE: {
      apiKey: "AIzaSyApLs9TpX6m1zuHgwouM8Ot0qgN2gD3v0A",
      authDomain: "sanya-1bd30.firebaseapp.com",
      projectId: "sanya-1bd30",
      storageBucket: "sanya-1bd30.firebasestorage.app",
      messagingSenderId: "437851305114",
      appId: "1:437851305114:web:110928e67e982c6b86db23",
      measurementId: "G-FVRRQTDD7K"
    },

    // Опрос на главной. Один голос на посетителя (по анонимному UID).
    POLL: {
      QUESTION: 'Каким будет 16 октября?',
      OPTIONS: [
        { id: 'great', label: 'Всё сбудется' },
        { id: 'usual', label: 'Обычный день' },
        { id: 'chaos', label: 'Что-то пойдёт не так' },
        { id: 'cake', label: 'Куплю торт' }
      ]
    }
  };

  // Общая инициализация Firebase (одна на страницу).
  var app = firebase.initializeApp(AppConfig.FIREBASE);
  window.__fbApp = app;
  window.__fbDB = firebase.firestore(app);
  if (typeof firebase.auth === 'function') {
    window.__fbAuth = firebase.auth(app);
  }
})();