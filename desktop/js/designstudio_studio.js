/* DESIGNSTUDIO_STUDIO_JS_V4_GRID_LIMIT_AND_CLAMP */
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

  function getWidgets(doc) {
    if (!doc) return [];
    return Array.prototype.slice.call(
      doc.querySelectorAll('.postitdesign-widget, .eqLogic-widget, .cmd-widget')
    ).filter(function (el) {
      return el && el.id !== 'designstudio-selection-box';
    });
  }

  function rectContainsCenter(containerRect, widgetRect) {
    var cx = widgetRect.left + widgetRect.width / 2;
    var cy = widgetRect.top + widgetRect.height / 2;

    return (
      cx >= containerRect.left &&
      cx <= containerRect.right &&
      cy >= containerRect.top &&
      cy <= containerRect.bottom
    );
  }

  function normalizedRect(r) {
    return {
      left: r.left,
      top: r.top,
      right: r.left + r.width,
      bottom: r.top + r.height,
      width: r.width,
      height: r.height
    };
  }

  function findDesignSurface(doc) {
    if (!doc) return null;

    var widgets = getWidgets(doc);
    var candidates = [];

    var preferredSelectors = [
      '#div_displayObject',
      '.div_displayObject',
      '#div_pageContainer',
      '.div_pageContainer',
      '#div_planContainer',
      '.div_planContainer',
      '.planContainer',
      '#planContainer'
    ];

    preferredSelectors.forEach(function (sel) {
      var el = doc.querySelector(sel);
      if (!el) return;
      var r = normalizedRect(el.getBoundingClientRect());
      if (r.width >= 180 && r.height >= 180) {
        candidates.push({ el: el, rect: r, priority: 0 });
      }
    });

    Array.prototype.slice.call(doc.querySelectorAll('div')).forEach(function (el) {
      if (!el || el.id === 'designstudio-selection-box') return;

      var r = normalizedRect(el.getBoundingClientRect());
      if (r.width < 180 || r.height < 180) return;

      var style = doc.defaultView.getComputedStyle(el);
      var bg = style.backgroundColor || '';

      var hasVisibleBg = (
        bg &&
        bg !== 'transparent' &&
        bg !== 'rgba(0, 0, 0, 0)' &&
        bg !== 'rgb(255, 255, 255)'
      );

      if (!hasVisibleBg && widgets.length > 0) return;

      candidates.push({ el: el, rect: r, priority: hasVisibleBg ? 1 : 2 });
    });

    if (widgets.length > 0) {
      candidates = candidates.filter(function (c) {
        var contained = 0;

        widgets.forEach(function (w) {
          var wr = normalizedRect(w.getBoundingClientRect());
          if (rectContainsCenter(c.rect, wr)) contained++;
        });

        return contained >= Math.max(1, Math.ceil(widgets.length * 0.66));
      });
    }

    candidates = candidates.filter(function (c) {
      var viewportW = doc.defaultView.innerWidth || 0;
      var viewportH = doc.defaultView.innerHeight || 0;

      if (viewportW > 0 && c.rect.width > viewportW * 0.98 && c.rect.height > viewportH * 0.90) {
        return false;
      }

      return true;
    });

    candidates.sort(function (a, b) {
      var areaA = a.rect.width * a.rect.height;
      var areaB = b.rect.width * b.rect.height;

      if (a.priority !== b.priority) return a.priority - b.priority;
      return areaA - areaB;
    });

    if (candidates.length > 0) {
      return candidates[0].rect;
    }

    if (widgets.length > 0) {
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;

      widgets.forEach(function (el) {
        var r = normalizedRect(el.getBoundingClientRect());
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.right);
        maxY = Math.max(maxY, r.bottom);
      });

      var margin = 40;
      return {
        left: Math.max(0, minX - margin),
        top: Math.max(0, minY - margin),
        right: maxX + margin,
        bottom: maxY + margin,
        width: Math.max(220, maxX - minX + margin * 2),
        height: Math.max(220, maxY - minY + margin * 2)
      };
    }

    return null;
  }

  function updateGridBounds() {
    var grid = qs('#designstudio_grid_overlay');
    var doc = iframeDocument();

    if (!grid || !doc) return false;

    var rect = findDesignSurface(doc);
    if (!rect) {
      writeScan('Grille : zone Design introuvable.');
      return false;
    }

    grid.style.left = Math.round(rect.left) + 'px';
    grid.style.top = Math.round(rect.top) + 'px';
    grid.style.width = Math.round(rect.width) + 'px';
    grid.style.height = Math.round(rect.height) + 'px';

    return true;
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

    var postit = start.closest('.postitdesign-widget');
    if (postit) return postit;

    var eq = start.closest('.eqLogic-widget');
    if (eq) return eq;

    var cmd = start.closest('.cmd-widget');
    if (cmd) return cmd;

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

    updateGridBounds();
    writeScan(eq + ' widget(s), ' + cmd + ' commande(s), ' + postit + ' post-it détecté(s). Sélection activée.');
    installSelectionHandlers();
    openPanel();
  }

  function clampDeltaToDesign(el, dx, dy) {
    var doc = iframeDocument();
    if (!doc || !el) return { dx: dx, dy: dy, blocked: false };

    var surface = findDesignSurface(doc);
    if (!surface) return { dx: dx, dy: dy, blocked: false };

    var r = normalizedRect(el.getBoundingClientRect());

    var newLeft = r.left + dx;
    var newTop = r.top + dy;
    var newRight = r.right + dx;
    var newBottom = r.bottom + dy;

    var clampedDx = dx;
    var clampedDy = dy;

    if (newLeft < surface.left) {
      clampedDx += surface.left - newLeft;
    }

    if (newRight > surface.right) {
      clampedDx -= newRight - surface.right;
    }

    if (newTop < surface.top) {
      clampedDy += surface.top - newTop;
    }

    if (newBottom > surface.bottom) {
      clampedDy -= newBottom - surface.bottom;
    }

    return {
      dx: clampedDx,
      dy: clampedDy,
      blocked: clampedDx !== dx || clampedDy !== dy
    };
  }

  function nudgeSelected(dx, dy) {
    if (!selectedElement) {
      writeSelectedHtml('Aucun objet sélectionné. Clique Scan puis sélectionne un objet.');
      openPanel();
      return;
    }

    var clamp = clampDeltaToDesign(selectedElement, dx, dy);
    dx = clamp.dx;
    dy = clamp.dy;

    if (dx === 0 && dy === 0) {
      updateSelectionBox(selectedElement);
      showSelectedInfo(selectedElement);
      writeScan('Limite du Design atteinte. Déplacement bloqué.');
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
    updateGridBounds();
    showSelectedInfo(selectedElement);

    if (clamp.blocked) {
      writeScan('Déplacement limité au bord du Design : ' + dx + ' / ' + dy + ' px. Non enregistré.');
    } else {
      writeScan('Déplacement visuel : ' + dx + ' / ' + dy + ' px. Non enregistré.');
    }
  }

  function toggleGrid() {
    var grid = qs('#designstudio_grid_overlay');
    if (!grid) return;

    var ok = updateGridBounds();

    if (!ok) {
      grid.classList.remove('is-visible');
      return;
    }

    grid.classList.toggle('is-visible');

    if (grid.classList.contains('is-visible')) {
      writeScan('Grille limitée à la zone réelle du Design.');
    } else {
      writeScan('Grille masquée.');
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
        updateGridBounds();
      }, 700);
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
        window.setTimeout(updateGridBounds, 400);
        window.setTimeout(updateGridBounds, 1400);
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
