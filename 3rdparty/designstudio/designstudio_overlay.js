/* DESIGNSTUDIO_GLOBAL_OVERLAY_V1 */
(function () {
  'use strict';

  if (window.designstudioGlobalOverlayLoaded) return;
  window.designstudioGlobalOverlayLoaded = true;

  function isPlanPage() {
    var url = String(window.location.href || '');
    return url.indexOf('p=plan') !== -1;
  }

  function stop(ev) {
    if (!ev) return false;
    try { ev.preventDefault(); } catch (e) {}
    try { ev.stopPropagation(); } catch (e) {}
    try { ev.stopImmediatePropagation(); } catch (e) {}
    return false;
  }

  function bindTouchSafe(el, fn) {
    var locked = false;

    function run(ev) {
      stop(ev);
      if (locked) return false;
      locked = true;
      window.setTimeout(function () { locked = false; }, 350);
      fn(ev);
      return false;
    }

    ['click', 'touchend', 'pointerup'].forEach(function (evt) {
      try {
        el.addEventListener(evt, run, { capture: true, passive: false });
      } catch (e) {
        el.addEventListener(evt, run, true);
      }
    });
  }

  function injectCss() {
    if (document.getElementById('designstudio-overlay-css')) return;

    var css = document.createElement('link');
    css.id = 'designstudio-overlay-css';
    css.rel = 'stylesheet';
    css.href = 'plugins/designstudio/3rdparty/designstudio/designstudio_overlay.css?v=' + Date.now();
    document.head.appendChild(css);
  }

  function createOverlay() {
    if (!isPlanPage()) return;
    if (document.getElementById('designstudio-overlay-root')) return;

    injectCss();

    var root = document.createElement('div');
    root.id = 'designstudio-overlay-root';
    root.className = 'designstudio-overlay-root';
    root.innerHTML =
      '<div class="designstudio-dock">' +
        '<button type="button" class="designstudio-dock-btn" data-action="panel">Studio</button>' +
        '<button type="button" class="designstudio-dock-btn" data-action="scan">Scan</button>' +
        '<button type="button" class="designstudio-dock-btn" data-action="grid">Grille</button>' +
      '</div>' +
      '<div class="designstudio-sidepanel">' +
        '<div class="designstudio-sidepanel-head">' +
          '<strong>Design Studio</strong>' +
          '<button type="button" class="designstudio-close" data-action="close">×</button>' +
        '</div>' +
        '<div class="designstudio-sidepanel-body">' +
          '<div class="designstudio-line">Overlay actif</div>' +
          '<div class="designstudio-line" id="designstudio-scan-result">Objets non scannés</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);

    root.addEventListener('click', stop, true);
    root.addEventListener('touchstart', stop, true);
    root.addEventListener('touchend', stop, true);
    root.addEventListener('pointerdown', stop, true);
    root.addEventListener('pointerup', stop, true);

    bindTouchSafe(root.querySelector('[data-action="panel"]'), function () {
      root.classList.toggle('is-open');
    });

    bindTouchSafe(root.querySelector('[data-action="close"]'), function () {
      root.classList.remove('is-open');
    });

    bindTouchSafe(root.querySelector('[data-action="scan"]'), function () {
      var widgets = document.querySelectorAll('.eqLogic-widget, .cmd-widget');
      var target = document.getElementById('designstudio-scan-result');
      if (target) target.textContent = widgets.length + ' objet(s) détecté(s) dans le Design';
      root.classList.add('is-open');
    });

    bindTouchSafe(root.querySelector('[data-action="grid"]'), function () {
      document.body.classList.toggle('designstudio-grid-visible');
    });
  }

  function boot() {
    createOverlay();
    window.setTimeout(createOverlay, 800);
    window.setTimeout(createOverlay, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
