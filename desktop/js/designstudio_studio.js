/* DESIGNSTUDIO_STUDIO_JS_V1 */
(function () {
  'use strict';

  function qs(sel) {
    return document.querySelector(sel);
  }

  function stop(ev) {
    if (!ev) return false;
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }

  function iframeDocument() {
    var iframe = qs('#designstudio_iframe');
    if (!iframe || !iframe.contentWindow) return null;
    try {
      return iframe.contentWindow.document;
    } catch (e) {
      return null;
    }
  }

  function openPanel() {
    var panel = qs('#designstudio_panel');
    if (panel) panel.classList.add('is-open');
  }

  function closePanel() {
    var panel = qs('#designstudio_panel');
    if (panel) panel.classList.remove('is-open');
  }

  function scanDesign() {
    var doc = iframeDocument();
    var result = qs('#designstudio_scan_result');

    if (!doc) {
      if (result) result.textContent = 'Erreur : impossible de lire le Design dans l’iframe.';
      openPanel();
      return;
    }

    var eq = doc.querySelectorAll('.eqLogic-widget').length;
    var cmd = doc.querySelectorAll('.cmd-widget').length;
    var postit = doc.querySelectorAll('.postitdesign-widget').length;

    if (result) {
      result.textContent = eq + ' widget(s), ' + cmd + ' commande(s), ' + postit + ' post-it détecté(s).';
    }

    openPanel();
  }

  function toggleGrid() {
    var grid = qs('#designstudio_grid_overlay');
    if (grid) grid.classList.toggle('is-visible');
  }

  function reloadFrame() {
    var iframe = qs('#designstudio_iframe');
    if (iframe) iframe.contentWindow.location.reload();
  }

  function boot() {
    document.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        stop(ev);

        var action = btn.getAttribute('data-action');

        if (action === 'panel') openPanel();
        if (action === 'close') closePanel();
        if (action === 'scan') scanDesign();
        if (action === 'grid') toggleGrid();
        if (action === 'reload') reloadFrame();

        return false;
      }, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
