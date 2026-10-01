(function (window) {

  'use strict';

  var CONFIG = {
    API_URL:
      'https://script.google.com/macros/s/AKfycbyGxJapubUBYKXwxESv5f6Ea13JT4LuIPgvgJ7NBHhJZDXQtq0QcfGGOFL7ZVn78VfUzA/exec',

    VERSION: '1.0.3',

    API_TIMEOUT: 25000,

    API_RETRIES: 2,

    RETRY_DELAY: 700
  };


  /*
   * =========================================================
   * CALLBACK
   * =========================================================
   */

  function createCallbackName() {

    return (
      'usd_jsonp_' +
      Date.now() +
      '_' +
      Math.random()
        .toString(36)
        .substring(2, 10)
    );

  }


  /*
   * =========================================================
   * SLEEP
   * =========================================================
   */

  function sleep(ms) {

    return new Promise(function (resolve) {

      setTimeout(
        resolve,
        ms
      );

    });

  }


  /*
   * =========================================================
   * SERIALIZE PARAMETER
   *
   * ВАЖНО:
   * массивы и объекты отправляем через JSON.stringify().
   *
   * Было:
   * ['CLS-001', 'CLS-002']
   *
   * могло превратиться в:
   * CLS-001,CLS-002
   *
   * Теперь отправляется:
   * ["CLS-001","CLS-002"]
   * =========================================================
   */

  function serializeValue(value) {

    if (
      Array.isArray(value)
    ) {

      return JSON.stringify(
        value
      );

    }


    if (
      value !== null &&
      typeof value === 'object'
    ) {

      return JSON.stringify(
        value
      );

    }


    if (
      value === undefined ||
      value === null
    ) {

      return '';

    }


    return String(
      value
    );

  }


  /*
   * =========================================================
   * BUILD QUERY
   * =========================================================
   */

  function buildQuery(
    params,
    callbackName
  ) {

    var searchParams =
      new URLSearchParams();


    Object.keys(
      params || {}
    ).forEach(
      function (key) {

        var value =
          params[key];

        searchParams.set(
          key,
          serializeValue(
            value
          )
        );

      }
    );


    searchParams.set(
      'callback',
      callbackName
    );


    searchParams.set(
      '_usd_version',
      CONFIG.VERSION
    );


    return searchParams.toString();

  }


  /*
   * =========================================================
   * ERROR MESSAGE
   * =========================================================
   */

  function errorMessage(error) {

    if (!error) {

      return 'Неизвестная ошибка.';

    }


    if (
      typeof error === 'string'
    ) {

      return error;

    }


    if (error.message) {

      return error.message;

    }


    if (
      error.error
    ) {

      return String(
        error.error
      );

    }


    return String(
      error
    );

  }


  /*
   * =========================================================
   * UNWRAP API RESPONSE
   *
   * Apps Script обычно возвращает:
   *
   * {
   *   success: true,
   *   data: ...
   * }
   *
   * Для старого frontend API оставляем поведение:
   *
   * USD.api('get_stages')
   *
   * возвращает непосредственно data.
   * =========================================================
   */

  function unwrapResponse(
    response
  ) {

    if (
      !response
    ) {

      return response;

    }


    if (
      response.success === false
    ) {

      throw new Error(
        response.error ||
        response.message ||
        'USD API вернул ошибку.'
      );

    }


    if (
      Object.prototype.hasOwnProperty.call(
        response,
        'data'
      )
    ) {

      return response.data;

    }


    return response;

  }


  /*
   * =========================================================
   * JSONP REQUEST
   * =========================================================
   */

  function requestJsonp(
    action,
    params
  ) {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        var callbackName =
          createCallbackName();


        var script =
          document.createElement(
            'script'
          );


        var finished =
          false;


        var startedAt =
          Date.now();


        var timeoutId;


        /*
         * -----------------------------------------------------
         * CLEANUP
         * -----------------------------------------------------
         */

        function cleanup() {

          if (timeoutId) {

            clearTimeout(
              timeoutId
            );

          }


          try {

            delete window[
              callbackName
            ];

          } catch (e) {

            window[
              callbackName
            ] = undefined;

          }


          if (
            script &&
            script.parentNode
          ) {

            script.parentNode.removeChild(
              script
            );

          }

        }


        /*
         * -----------------------------------------------------
         * SUCCESS
         * -----------------------------------------------------
         */

        function finishSuccess(
          data
        ) {

          if (finished) {

            return;

          }


          finished =
            true;


          var elapsed =
            Date.now() -
            startedAt;


          cleanup();


          console.log(
            'USD API:',
            action,
            '—',
            elapsed,
            'ms'
          );


          resolve(
            data
          );

        }


        /*
         * -----------------------------------------------------
         * ERROR
         * -----------------------------------------------------
         */

        function finishError(
          error
        ) {

          if (finished) {

            return;

          }


          finished =
            true;


          cleanup();


          reject(
            error
          );

        }


        /*
         * -----------------------------------------------------
         * JSONP CALLBACK
         * -----------------------------------------------------
         */

        window[
          callbackName
        ] = function (
          data
        ) {

          finishSuccess(
            data
          );

        };


        /*
         * -----------------------------------------------------
         * SCRIPT ERROR
         * -----------------------------------------------------
         */

        script.onerror =
          function () {

            finishError(
              new Error(
                'Ошибка соединения с USD API.'
              )
            );

          };


        /*
         * -----------------------------------------------------
         * TIMEOUT
         * -----------------------------------------------------
         */

        timeoutId =
          setTimeout(
            function () {

              finishError(
                new Error(
                  'USD API: превышено время ожидания.'
                )
              );

            },
            CONFIG.API_TIMEOUT
          );


        /*
         * -----------------------------------------------------
         * REQUEST PARAMS
         * -----------------------------------------------------
         */

        var requestParams =
          Object.assign(
            {},
            params || {},
            {
              action:
                action
            }
          );


        /*
         * -----------------------------------------------------
         * QUERY
         * -----------------------------------------------------
         */

        var query =
          buildQuery(
            requestParams,
            callbackName
          );


        /*
         * -----------------------------------------------------
         * URL
         * -----------------------------------------------------
         */

        script.src =
          CONFIG.API_URL +
          '?' +
          query;


        script.async =
          true;


        /*
         * -----------------------------------------------------
         * APPEND
         * -----------------------------------------------------
         */

        document
          .head
          .appendChild(
            script
          );

      }
    );

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  async function api(
    action,
    params
  ) {

    var startedAt =
      Date.now();


    var lastError =
      null;


    for (
      var attempt = 0;
      attempt <= CONFIG.API_RETRIES;
      attempt++
    ) {

      try {

        /*
         * ---------------------------------------------------
         * REQUEST
         * ---------------------------------------------------
         */

        var rawResponse =
          await requestJsonp(
            action,
            params || {}
          );


        /*
         * ---------------------------------------------------
         * UNWRAP
         * ---------------------------------------------------
         */

        var data =
          unwrapResponse(
            rawResponse
          );


        /*
         * ---------------------------------------------------
         * TOTAL TIME
         * ---------------------------------------------------
         */

        var totalElapsed =
          Date.now() -
          startedAt;


        console.log(
          'USD API:',
          action,
          '— всего:',
          totalElapsed,
          'ms'
        );


        /*
         * ---------------------------------------------------
         * RETURN
         * ---------------------------------------------------
         */

        return data;


      } catch (
        error
      ) {

        lastError =
          error;


        console.error(
          'USD API error:',
          action,
          'attempt:',
          attempt + 1,
          error
        );


        /*
         * ---------------------------------------------------
         * RETRY
         * ---------------------------------------------------
         */

        if (
          attempt <
          CONFIG.API_RETRIES
        ) {

          await sleep(
            CONFIG.RETRY_DELAY
          );

        }

      }

    }


    throw (
      lastError ||
      new Error(
        'Не удалось выполнить запрос USD API.'
      )
    );

  }


  /*
   * =========================================================
   * GLOBAL USD OBJECT
   * =========================================================
   */

  window.USD = {

    VERSION:
      CONFIG.VERSION,

    CONFIG:
      CONFIG,

    api:
      api,

    errorMessage:
      errorMessage

  };


  /*
   * =========================================================
   * LOG
   * =========================================================
   */

  console.log(
    'USD Global API loaded:',
    CONFIG.VERSION
  );


})(window);
