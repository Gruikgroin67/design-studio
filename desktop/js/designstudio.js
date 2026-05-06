/* DESIGNSTUDIO_ADMIN_JS_V4_SAFE */
(function () {
  'use strict';

  function writeResult(value) {
    var node = document.getElementById('designstudio_result');
    if (!node) return;

    if (typeof value !== 'string') {
      try {
        value = JSON.stringify(value, null, 2);
      } catch (e) {
        value = String(value);
      }
    }

    node.textContent = value;
  }

  function bindSimple(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('click', function (ev) {
      ev.preventDefault();
      fn();
    }, false);
  }

  function ajaxPing() {
    writeResult('Test AJAX en cours...');

    var done = false;

    var timer = window.setTimeout(function () {
      if (done) return;
      done = true;
      writeResult('ERREUR: timeout AJAX après 5 secondes.');
    }, 5000);

    $.ajax({
      type: 'POST',
      url: 'plugins/designstudio/core/ajax/designstudio.ajax.php',
      data: {
        action: 'ping'
      },
      dataType: 'json',
      cache: false,
      global: false,
      success: function (response) {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        writeResult({
          ajax: 'success',
          response: response
        });
      },
      error: function (xhr, status, error) {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        writeResult({
          ajax: 'error',
          status: status,
          error: error,
          responseText: xhr && xhr.responseText ? xhr.responseText : ''
        });
      }
    });
  }

  function boot() {
    writeResult('JS chargé correctement.');

    bindSimple('bt_designstudio_js', function () {
      writeResult('OK: clic JS local fonctionnel.');
    });

    bindSimple('bt_designstudio_ping', ajaxPing);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
