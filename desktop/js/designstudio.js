/* DESIGNSTUDIO_ADMIN_JS_V7_PREPARE_TOOLBAR */
(function () {
  'use strict';

  function bindPrepareButtons() {
    document.querySelectorAll('.designstudio-prepare-btn').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();

        var planId = btn.getAttribute('data-plan-id');
        if (!planId) return;

        btn.disabled = true;
        btn.textContent = 'Préparation...';

        $.ajax({
          type: 'POST',
          url: 'plugins/designstudio/core/ajax/designstudio.ajax.php',
          data: {
            action: 'prepareToolbar',
            plan_id: planId
          },
          dataType: 'json',
          cache: false,
          global: false,
          success: function () {
            btn.textContent = 'Toolbar préparée';
            btn.classList.add('is-ready');

            var card = btn.closest('.designstudio-design-card');
            if (card) {
              var state = card.querySelector('.designstudio-design-state');
              if (state) state.textContent = 'Toolbar préparée';
            }
          },
          error: function () {
            btn.disabled = false;
            btn.textContent = 'Erreur';
            window.setTimeout(function () {
              btn.textContent = 'Préparer toolbar';
            }, 2000);
          }
        });
      }, false);
    });
  }

  function boot() {
    window.designstudioAdminLoaded = true;
    bindPrepareButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
