/* DESIGNSTUDIO_STUDIO_JS_V2_OBJECT_SELECTION */
(function () {
  'use strict';

  var selectedElement = null;
  var selectionEnabled = false;

  function qs(sel) {
    return document.querySelector(sel);
  }

  function stop(ev) {
    if (!ev) return false;
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    return false;
  }

  function iframeElement() {
    return qs('#designstudio_iframe');
  }

  function iframeDocument() {
    var iframe = iframeElement();
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

  function writeScan(text) {
    var result = qs('#designstudio_scan_result');
    if (result) result.textContent = text;
  }

  function ensureSelectionBox(doc) {
    var box = doc.getElementById('designstudio-selection-box');
    if (box) return box;

    box = doc.createElement('div');
    box.id = 'designstudio-selection-box';
    box.style.position = 'absolute';
    box.style.zIndex = '2147482000';
    box.style.pointerEvents = 'none';
    box.style.border = '3px solid #2f80ed';
    box.style.borderRadius = '8px';
    box.style.boxShadow = '0 0 0 9999px rgba(47,128,237,.06)';
    box.style.display = 'none';

    doc.body.appendChild(box);
    return box;
  }

  function getCleanText(el) {
    var txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (txt.length > 120) txt = txt.slice(0, 120) + '...';
    return txt;
  }

  function getWidgetType(el) {
    if (el.classList.contains('postitdesign-widget')) return 'Post-it Design';
    if (el.classList.contains('eqLogic-widget')) return 'Widget équipement';
    if (el.classList.contains('cmd-widget')) return 'Widget commande';
    return 'Objet';
  }

  function getAttr(el, name) {
    return el.getAttribute(name) || '';
  }

  function updateSelectionBox(el) {
    var doc = iframeDocument();
    if (!doc || !el) return;

    var box = ensureSelectionBox(doc);
    var rect = el.getBoundingClientRect();
    var scrollX = doc.defaultView.pageXOffset || doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
    var scrollY = doc.defaultView.pageYOffset || doc.documentElement.scrollTop || doc.body.scrollTop || 0;

    box.style.left = Math.round(rect.left + scrollX) + 'px';
    box.style.top = Math.round(rect.top + scrollY) + 'px';
    box.style.width = Math.round(rect.width) + 'px';
    box.style.height = Math.round(rect.height) + 'px';
    box.style.display = 'block';
  }

  function showSelectedInfo(el) {
    if (!el) return;

    var rect = el.getBoundingClientRect();
    var style = el.ownerDocument.defaultView.getComputedStyle(el);

    var html = '';
    html += '<div class="designstudio-selected-title">Objet sélectionné</div>';
    html += '<div class="designstudio-kv"><b>Type</b><span>' + getWidgetType(el) + '</span></div>';
    html += '<div class="designstudio-kv"><b>Texte</b><span>' + escapeHtml(getCleanText(el) || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Position écran</b><span>x=' + Math.round(rect.left) + ', y=' + Math.round(rect.top) + '</span></div>';
    html += '<div class="designstudio-kv"><b>Taille</b><span>' + Math.round(rect.width) + ' × ' + Math.round(rect.height) + ' px</span></div>';
    html += '<div class="designstudio-kv"><b>CSS left/top</b><span>' + (style.left || '—') + ' / ' + (style.top || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>eqLogic ID</b><span>' + (getAttr(el, 'data-eqlogic_id') || getAttr(el, 'data-eqlogic-id') || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>cmd ID</b><span>' + (getAttr(el, 'data-cmd_id') || getAttr(el, 'data-cmd-id') || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Classes</b><span>' + escapeHtml(el.className || '—') + '</span></div>';

    var selected = qs('#designstudio_selected_info');
    if (selected) selected.innerHTML = html;

    openPanel();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function selectElement(el) {
    selectedElement = el;
    updateSelectionBox(el);
    showSelectedInfo(el);
  }

  function findStudioTarget(start) {
    if (!start) return null;

    if (start.closest) {
      return start.closest('.postitdesign-widget, .eqLogic-widget, .cmd-widget');
    }

    return null;
  }

  function installSelectionHandlers() {
    var doc = iframeDocument();

    if (!doc) {
      writeScan('Erreur : impossible de lire le Design dans l’iframe.');
      openPanel();
      return;
    }

    if (doc.body.getAttribute('data-designstudio-selection-installed') === '1') {
      selectionEnabled = true;
      writeScan('Mode sélection déjà actif.');
      return;
    }

    doc.body.setAttribute('data-designstudio-selection-installed', '1');
    selectionEnabled = true;

    doc.addEventListener('click', function (ev) {
      if (!selectionEnabled) return;

      var target = findStudioTarget(ev.target);
      if (!target) return;

      stop(ev);
      selectElement(target);
      return false;
    }, true);

    doc.addEventListener('touchend', function (ev) {
      if (!selectionEnabled) return;

      var target = findStudioTarget(ev.target);
      if (!target) return;

      stop(ev);
      selectElement(target);
      return false;
    }, { capture: true, passive: false });

    doc.addEventListener('pointerup', function (ev) {
      if (!selectionEnabled) return;

      var target = findStudioTarget(ev.target);
      if (!target) return;

      stop(ev);
      selectElement(target);
      return false;
    }, true);

    writeScan('Mode sélection actif : clique un objet dans le Design.');
    openPanel();
  }

  function scanDesign() {
    var doc = iframeDocument();

    if (!doc) {
      writeScan('Erreur : impossible de lire le Design dans l’iframe.');
      openPanel();
      return;
    }

    var eq = doc.querySelectorAll('.eqLogic-widget').length;
    var cmd = doc.querySelectorAll('.cmd-widget').length;
    var postit = doc.querySelectorAll('.postitdesign-widget').length;

    writeScan(eq + ' widget(s), ' + cmd + ' commande(s), ' + postit + ' post-it détecté(s). Sélection activée.');
    installSelectionHandlers();
    openPanel();
  }

  function toggleGrid() {
    var grid = qs('#designstudio_grid_overlay');
    if (grid) grid.classList.toggle('is-visible');
  }

  function reloadFrame() {
    var iframe = iframeElement();
    if (iframe && iframe.contentWindow) {
      selectedElement = null;
      iframe.contentWindow.location.reload();
      window.setTimeout(function () {
        writeScan('Design rechargé. Relance Scan pour sélectionner.');
      }, 500);
    }
  }

  function bindDock() {
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

  function boot() {
    bindDock();

    var iframe = iframeElement();
    if (iframe) {
      iframe.addEventListener('load', function () {
        selectedElement = null;
        writeScan('Design chargé. Clique Scan pour activer la sélection.');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
