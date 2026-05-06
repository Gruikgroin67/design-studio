/* DESIGNSTUDIO_ADMIN_JS_V9_OVERLAY_SETTINGS */
(function () {
  'use strict';

  function boot() {
    var btn = document.getElementById('bt_designstudio_toggle_overlay');
    if (!btn) return;

    btn.addEventListener('click', function (ev) {
      ev.preventDefault();

      var current = parseInt(btn.getAttribute('data-enabled') || '0', 10);
      var next = current === 1 ? 0 : 1;

      btn.disabled = true;
      btn.textContent = 'Mise à jour...';

      $.ajax({
        type: 'POST',
        url: 'plugins/designstudio/core/ajax/designstudio.ajax.php',
        data: {
          action: 'setOverlayEnabled',
          enabled: next
        },
        dataType: 'json',
        cache: false,
        global: false,
        success: function () {
          btn.disabled = false;
          btn.setAttribute('data-enabled', String(next));
          btn.classList.toggle('is-on', next === 1);
          btn.classList.toggle('is-off', next !== 1);
          btn.textContent = next === 1 ? 'Overlay activé' : 'Overlay désactivé';
        },
        error: function () {
          btn.disabled = false;
          btn.textContent = current === 1 ? 'Overlay activé' : 'Overlay désactivé';
        }
      });
    }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
