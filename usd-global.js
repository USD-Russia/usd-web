/* =====================================================
   USD — GLOBAL JS
   Версия: 1.0.0
   ===================================================== */

(function (window) {

  'use strict';

  /* =====================================================
     CONFIG
     ===================================================== */

  const CONFIG = {

    API_URL:
      'https://script.google.com/macros/s/AKfycbw9poI4pAipmx6CduwLxGxYNnSENCI7Rinsdkd7oBVQVvHo0AJ0Dc7Y1LdpwvhSQcQ0Nw/exec',

    VERSION: '1.0.0',

    API_TIMEOUT: 15000

  };


  /* =====================================================
     USD OBJECT
     ===================================================== */

  const USD = {

    VERSION: CONFIG.VERSION,

    API_URL: CONFIG.API_URL,


    /* ===================================================
       API REQUEST
       =================================================== */

    api: function (action, params) {

      return new Promise(function (resolve, reject) {

        params = params || {};

        if (!action) {
          reject(new Error('Не указано действие API.'));
          return;
        }


        const callbackName =
          'usdApiCallback_' +
          Date.now() +
          '_' +
          Math.floor(Math.random() * 100000);


        const script =
          document.createElement('script');


        const query =
          new URLSearchParams();


        query.set('action', action);
        query.set('callback', callbackName);


        Object.keys(params).forEach(function (key) {

          const value = params[key];

          if (
            value !== undefined &&
            value !== null
          ) {

            query.set(
              key,
              typeof value === 'object'
                ? JSON.stringify(value)
                : String(value)
            );

          }

        });


        let finished = false;


        const timeout =
          setTimeout(function () {

            cleanup();

            reject(
              new Error(
                'API: превышено время ожидания ответа.'
              )
            );

          }, CONFIG.API_TIMEOUT);


        function cleanup() {

          clearTimeout(timeout);

          try {
            delete window[callbackName];
          } catch (error) {
            window[callbackName] = undefined;
          }

          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }

        }


        window[callbackName] =
          function (response) {

            if (finished) {
              return;
            }

            finished = true;

            cleanup();


            if (
              !response ||
              response.success !== true
            ) {

              reject(
                new Error(
                  response &&
                  response.error
                    ? response.error
                    : 'Ошибка API.'
                )
              );

              return;
            }


            resolve(response.data);

          };


        script.onerror =
          function () {

            if (finished) {
              return;
            }

            finished = true;

            cleanup();

            reject(
              new Error(
                'Не удалось подключиться к API.'
              )
            );

          };


        script.src =
          CONFIG.API_URL +
          '?' +
          query.toString();


        document.body.appendChild(script);

      });

    },


    /* ===================================================
       HTML ESCAPE
       =================================================== */

    escapeHtml: function (value) {

      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    },


    /* ===================================================
       ATTRIBUTE ESCAPE
       =================================================== */

    escapeAttribute: function (value) {

      return this.escapeHtml(value);

    },


    /* ===================================================
       DATE FORMAT
       =================================================== */

    formatDate: function (value) {

      if (!value) {
        return '—';
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return String(value);

      }


      return date.toLocaleString(
        'ru-RU',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

    },


    /* ===================================================
       SIMPLE DATE
       =================================================== */

    formatDateOnly: function (value) {

      if (!value) {
        return '—';
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return String(value);

      }


      return date.toLocaleDateString(
        'ru-RU'
      );

    },


    /* ===================================================
       ERROR
       =================================================== */

    errorMessage: function (error) {

      if (
        error &&
        error.message
      ) {

        return error.message;

      }

      return String(error || 'Неизвестная ошибка.');

    }

  };


  /* =====================================================
     GLOBAL USD
     ===================================================== */

  window.USD = USD;


  /* =====================================================
     READY EVENT
     ===================================================== */

  window.dispatchEvent(
    new CustomEvent(
      'usd:global-ready',
      {
        detail: {
          version: CONFIG.VERSION
        }
      }
    )
  );


})(window);
