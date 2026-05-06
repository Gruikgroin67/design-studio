/* DESIGNSTUDIO_ADMIN_JS_V2 */
(function () {
  'use strict';

  function stopEvent(ev) {
    if (!ev) return false;
    try { ev.preventDefault(); } catch (e) {}
    try { ev.stopPropagation(); } catch (e) {}
    try { ev.stopImmediatePropagation(); } catch (e) {}
    return false;
  }

  function bindTouchSafe(el, handler) {
    if (!el || typeof handler !== 'function') return;

    var locked = false;

    var run = function (ev) {
      stopEvent(ev);

      if (locked) return false;
      locked = true;
      window.setTimeout(function () {
        locked = false;
      }, 450);

      handler(ev);
      return false;
    };

    el.onclick = run;
    el.ontouchend = run;
    el.onpointerup = run;

    try {
      el.addEventListener('click', run, { capture: true, passive: false });
      el.addEventListener('touchend', run, { capture: true, passive: false });
      el.addEventListener('pointerup', run, { capture: true, passive: false });
    } catch (e) {
      el.addEventListener('click', run, true);
      el.addEventListener('touchend', run, true);
      el.addEventListener('pointerup', run, true);
    }
  }

  function writeResult(text) {
    var result = document.getElementById('designstudio_result');
    if (result) result.textContent = text;
  }

  function ping() {
    writeResult('Test AJAX en cours...');

    $.ajax({
      type: 'POST',
      url: 'plugins/designstudio/core/ajax/designstudio.ajax.php',
      data: {
        action: 'ping'
      },
      dataType: 'json',
      global: false,
      error: function (request) {
        writeResult('ERREUR AJAX\n' + (request && request.responseText ? request.responseText : 'Réponse vide'));
      },
      success: function (data) {
        writeResult(JSON.stringify(data, null, 2));
      }
    });
  }

  function boot() {
    var btn = document.getElementById('bt_designstudio_ping');
    bindTouchSafe(btn, ping);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
