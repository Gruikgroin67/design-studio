/* DESIGNSTUDIO_ADMIN_JS_V8_NATIVE_TOOLBAR */
(function () {
  'use strict';

  function bindPrepareButtons() {
    document.querySelectorAll('.designstudio-prepare-btn').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();

        var planId = btn.getAttribute('data-plan-id');
        if (!planId) return;

        btn.disabled = true;
        btn.textContent = 'Création...';

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
          success: function (response) {
            btn.textContent = 'Équipement créé';
            btn.classList.add('is-ready');

            var card = btn.closest('.designstudio-design-card');
            if (card) {
              var state = card.querySelector('.designstudio-design-state');
              if (state) state.textContent = 'Toolbar préparée - équipement créé';
            }
          },
          error: function (xhr) {
            btn.disabled = false;
            btn.textContent = 'Erreur';
            console.error('[DesignStudio] prepareToolbar error', xhr && xhr.responseText ? xhr.responseText : xhr);
            window.setTimeout(function () {
              btn.textContent = 'Préparer toolbar';
            }, 2000);
          }
        });
      }, false);
    });
  }

  function bindToolbarWidgets() {
    document.querySelectorAll('.designstudio-toolbar-widget .designstudio-toolbar-button').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        var widget = btn.closest('.designstudio-toolbar-widget');
        if (widget) widget.classList.toggle('is-open');
      }, false);
    });
  }

  function boot() {
    window.designstudioAdminLoaded = true;
    bindPrepareButtons();
    bindToolbarWidgets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
