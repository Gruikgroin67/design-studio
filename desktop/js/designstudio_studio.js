/* DESIGNSTUDIO_STUDIO_JS_V3_OBJECT_SELECTION_AND_VISUAL_NUDGE */
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

  function writeSelectedHtml(html) {
    var selected = qs('#designstudio_selected_info');
    if (selected) selected.innerHTML = html;
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

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function pxToNumber(value, fallback) {
    var n = parseFloat(value);
    if (isNaN(n)) return fallback;
    return n;
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
    if (!el) {
      writeSelectedHtml('Aucun objet sélectionné.');
      return;
    }

    var rect = el.getBoundingClientRect();
    var style = el.ownerDocument.defaultView.getComputedStyle(el);
    var moved = el.getAttribute('data-designstudio-visual-moved') === '1';

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
    html += '<div class="designstudio-kv"><b>Déplacé</b><span>' + (moved ? 'Oui, visuel uniquement' : 'Non') + '</span></div>';

    writeSelectedHtml(html);
    openPanel();
  }

  function selectElement(el) {
    selectedElement = el;
    updateSelectionBox(el);
    showSelectedInfo(el);
  }

  function findStudioTarget(start) {
    if (!start || !start.closest) return null;
    return start.closest('.postitdesign-widget, .eqLogic-widget, .cmd-widget');
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

    function onPick(ev) {
      if (!selectionEnabled) return;

      var target = findStudioTarget(ev.target);
      if (!target) return;

      stop(ev);
      selectElement(target);
      return false;
    }

    doc.addEventListener('click', onPick, true);

    try {
      doc.addEventListener('touchend', onPick, { capture: true, passive: false });
    } catch (e) {
      doc.addEventListener('touchend', onPick, true);
    }

    doc.addEventListener('pointerup', onPick, true);

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

  function nudgeSelected(dx, dy) {
    if (!selectedElement) {
      writeSelectedHtml('Aucun objet sélectionné. Clique Scan puis sélectionne un objet.');
      openPanel();
      return;
    }

    var win = selectedElement.ownerDocument.defaultView;
    var style = win.getComputedStyle(selectedElement);

    if (style.position === 'static') {
      selectedElement.style.position = 'relative';
    }

    var left = pxToNumber(style.left, selectedElement.offsetLeft || 0);
    var top = pxToNumber(style.top, selectedElement.offsetTop || 0);

    selectedElement.style.left = Math.round(left + dx) + 'px';
    selectedElement.style.top = Math.round(top + dy) + 'px';
    selectedElement.setAttribute('data-designstudio-visual-moved', '1');

    updateSelectionBox(selectedElement);
    showSelectedInfo(selectedElement);
    writeScan('Déplacement visuel : ' + dx + ' / ' + dy + ' px. Non enregistré.');
  }

  function findDesignSurface(doc) {
    if (!doc) return null;

    var selectors = [
      '.div_displayObject',
      '#div_displayObject',
      '.planContainer',
      '#div_pageContainer',
      '#div_planContainer',
      '.planHeader',
      '.plan'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = doc.querySelector(selectors[i]);
      if (!el) continue;

      var r = el.getBoundingClientRect();
      if (r.width > 150 && r.height > 150) {
        return el;
      }
    }

    var widgets = Array.prototype.slice.call(doc.querySelectorAll('.eqLogic-widget, .cmd-widget, .postitdesign-widget'));
    if (!widgets.length) return null;

    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    widgets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    });

    return {
      getBoundingClientRect: function () {
        return {
          left: minX,
          top: minY,
          width: Math.max(220, maxX - minX),
          height: Math.max(220, maxY - minY)
        };
      }
    };
  }

  function updateGridBounds() {
    var grid = qs('#designstudio_grid_overlay');
    var doc = iframeDocument();

    if (!grid || !doc) return false;

    var surface = findDesignSurface(doc);
    if (!surface) return false;

    var rect = surface.getBoundingClientRect();

    grid.style.left = Math.round(rect.left) + 'px';
    grid.style.top = Math.round(rect.top) + 'px';
    grid.style.width = Math.round(rect.width) + 'px';
    grid.style.height = Math.round(rect.height) + 'px';

    return true;
  }

  function toggleGrid() {
    var grid = qs('#designstudio_grid_overlay');
    if (!grid) return;

    updateGridBounds();
    grid.classList.toggle('is-visible');

    if (grid.classList.contains('is-visible')) {
      writeScan('Grille limitée à la zone du Design.');
    }
  }

  function reloadFrame() {
    var iframe = iframeElement();
    if (iframe && iframe.contentWindow) {
      selectedElement = null;
      iframe.contentWindow.location.reload();
      window.setTimeout(function () {
        writeScan('Design rechargé. Relance Scan pour sélectionner.');
        writeSelectedHtml('Aucun objet sélectionné.');
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

  function bindNudgeTools() {
    document.querySelectorAll('[data-nudge-dx][data-nudge-dy]').forEach(function (btn) {
      btn.addEventListener('click', function (ev) {
        stop(ev);

        var dx = parseInt(btn.getAttribute('data-nudge-dx') || '0', 10);
        var dy = parseInt(btn.getAttribute('data-nudge-dy') || '0', 10);

        nudgeSelected(dx, dy);
        return false;
      }, false);
    });
  }

  function boot() {
    bindDock();
    bindNudgeTools();

    var iframe = iframeElement();
    if (iframe) {
      iframe.addEventListener('load', function () {
        selectedElement = null;
        writeScan('Design chargé. Clique Scan pour activer la sélection.');
        writeSelectedHtml('Aucun objet sélectionné.');
        window.setTimeout(updateGridBounds, 300);
        window.setTimeout(updateGridBounds, 1200);
      });
    }

    window.addEventListener('resize', function () {
      updateGridBounds();
    }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
