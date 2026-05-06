/* DESIGNSTUDIO_ADMIN_JS_V3 */
(function () {
  'use strict';

  console.log('[DesignStudio] JS loaded');

  function stopEvent(ev) {
    if (!ev) return false;

    try { ev.preventDefault(); } catch (e) {}
    try { ev.stopPropagation(); } catch (e) {}
    try { ev.stopImmediatePropagation(); } catch (e) {}

    return false;
  }

  function bindTouchSafe(el, handler) {
    if (!el || typeof handler !== 'function') {
      return;
    }

    var locked = false;

    var run = function (ev) {
      stopEvent(ev);

      if (locked) {
        return false;
      }

      locked = true;

      window.setTimeout(function () {
        locked = false;
      }, 450);

      handler(ev);

      return false;
    };

    [
      'click',
      'touchend',
      'pointerup'
    ].forEach(function (evt) {
      try {
        el.addEventListener(evt, run, {
          capture: true,
          passive: false
        });
      } catch (e) {
        el.addEventListener(evt, run, true);
      }
    });
  }

  function resultNode() {
    return document.getElementById('designstudio_result');
  }

  function writeResult(value) {
    var node = resultNode();

    if (!node) {
      console.warn('[DesignStudio] result node not found');
      return;
    }

    if (typeof value !== 'string') {
      try {
        value = JSON.stringify(value, null, 2);
      } catch (e) {
        value = String(value);
      }
    }

    node.textContent = value;
  }

  function ping() {
    console.log('[DesignStudio] ping start');

    writeResult('Chargement AJAX...');

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
        console.log('[DesignStudio] ajax success', response);

        writeResult({
          ajax: 'success',
          response: response
        });
      },

      error: function (xhr, status, error) {
        console.error('[DesignStudio] ajax error', status, error);

        writeResult({
          ajax: 'error',
          status: status,
          error: error,
          responseText: xhr && xhr.responseText ? xhr.responseText : null
        });
      }
    });
  }

  function boot() {
    console.log('[DesignStudio] boot');

    var btn = document.getElementById('bt_designstudio_ping');

    if (!btn) {
      console.warn('[DesignStudio] button not found');
      return;
    }

    bindTouchSafe(btn, ping);

    writeResult('Design Studio prêt.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
