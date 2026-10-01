/* =====================================================
   USD — GLOBAL JS
   Версия: 1.0.2
   ===================================================== */

(function (window) {

  'use strict';

  /* =====================================================
     CONFIG
     ===================================================== */

  const CONFIG = {

    API_URL:
      'https://script.google.com/macros/s/AKfycbw9poI4pAipmx6CduwLxGxYNnSENCI7Rinsdkd7oBVQVvHo0AJ0Dc7Y1LdpwvhSQcQ0Nw/exec',

    VERSION: '1.0.2',

    API_TIMEOUT: 25000,

    API_RETRIES: 2,

    RETRY_DELAY: 700

  };


  /* =====================================================
     JSONP REQUEST
     ===================================================== */

  function apiRequest_(action, params) {

    return new Promise(function (resolve, reject) {

      params = params || {};

      const callbackName =
        'usdApiCallback_' +
        Date.now() +
        '_' +
        Math.floor(
          Math.random() * 100000
        );

      const script =
        document.createElement('script');

      const query =
        new URLSearchParams();

      query.set(
        'action',
        action
      );

      query.set(
        'callback',
        callbackName
      );


      Object.keys(params).forEach(
        function (key) {

          const value =
            params[key];

          if (
            value !== undefined &&
            value !== null
          ) {

            query.set(
              key,
              String(value)
            );

          }

        }
      );


      let completed = false;


      function cleanup() {

        clearTimeout(timeout);

        try {

          delete window[
            callbackName
          ];

        } catch (error) {

          window[
            callbackName
          ] = undefined;

        }


        if (
          script.parentNode
        ) {

          script.parentNode.removeChild(
            script
          );

        }

      }


      const timeout =
        setTimeout(
          function () {

            if (completed) {
              return;
            }

            completed = true;

            cleanup();

            reject(
              new Error(
                'API: превышено время ожидания ответа.'
              )
            );

          },
          CONFIG.API_TIMEOUT
        );


      window[
        callbackName
      ] = function (response) {

        if (completed) {
          return;
        }

        completed = true;

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


        resolve(
          response.data
        );

      };


      script.onerror =
        function () {

          if (completed) {
            return;
          }

          completed = true;

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


      document.body.appendChild(
        script
      );

    });

  }


  /* =====================================================
     API WITH RETRIES
     ===================================================== */

  async function api(
  action,
  params
) {

  let lastError = null;

  const totalStart = performance.now();

  for (
    let attempt = 1;
    attempt <= CONFIG.API_RETRIES;
    attempt++
  ) {

    const attemptStart = performance.now();

    try {

      const result = await apiRequest_(
        action,
        params
      );

      const elapsed =
        Math.round(
          performance.now() -
          attemptStart
        );

      const totalElapsed =
        Math.round(
          performance.now() -
          totalStart
        );

      console.log(
        'USD API: ' +
        action +
        ' — ' +
        elapsed +
        ' ms' +
        (
          attempt > 1
            ? ' (попытка ' + attempt + ')'
            : ''
        ) +
        ', всего: ' +
        totalElapsed +
        ' ms'
      );

      return result;

    } catch (error) {

      lastError = error;

      const elapsed =
        Math.round(
          performance.now() -
          attemptStart
        );

      console.warn(
        'USD API: ' +
        action +
        ' — попытка ' +
        attempt +
        ' из ' +
        CONFIG.API_RETRIES +
        ' не удалась за ' +
        elapsed +
        ' ms.',
        error
      );

      if (
        attempt <
        CONFIG.API_RETRIES
      ) {

        await new Promise(
          function (resolve) {

            setTimeout(
              resolve,
              CONFIG.RETRY_DELAY
            );

          }
        );

      }

    }

  }

  console.error(
    'USD API: ' +
    action +
    ' окончательно завершился ошибкой.'
  );

  throw lastError;

}

  /* =====================================================
     USD OBJECT
     ===================================================== */

  const USD = {

    VERSION:
      CONFIG.VERSION,

    API_URL:
      CONFIG.API_URL,

    api:
      api,


    /* ===================================================
       HTML ESCAPE
       =================================================== */

    escapeHtml:
      function (value) {

        return String(
          value ?? ''
        )
          .replace(
            /&/g,
            '&amp;'
          )
          .replace(
            /</g,
            '&lt;'
          )
          .replace(
            />/g,
            '&gt;'
          )
          .replace(
            /"/g,
            '&quot;'
          )
          .replace(
            /'/g,
            '&#039;'
          );

      },


    /* ===================================================
       ATTRIBUTE ESCAPE
       =================================================== */

    escapeAttribute:
      function (value) {

        return this.escapeHtml(
          value
        );

      },


    /* ===================================================
       DATE
       =================================================== */

    formatDate:
      function (value) {

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
       DATE ONLY
       =================================================== */

    formatDateOnly:
      function (value) {

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
       ERROR MESSAGE
       =================================================== */

    errorMessage:
      function (error) {

        if (
          error &&
          error.message
        ) {

          return error.message;

        }


        return String(
          error ||
          'Неизвестная ошибка.'
        );

      }

  };


  /* =====================================================
     GLOBAL
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
          version:
            CONFIG.VERSION
        }
      }
    )
  );


})(window);
