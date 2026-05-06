/* DESIGNSTUDIO_STUDIO_JS_V7_MULTI_SELECT_ALIGN_SAVE */
(function () {
  'use strict';

  var selectedElement = null;
  var selectedElements = [];
  var multiMode = false;
  var selectionEnabled = false;
  var gridVisible = false;
  var lastPickAt = 0;
  var lastPickKey = '';

  function qs(sel) {
    return document.querySelector(sel);
  }

  function qsa(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
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

  function getPlanId() {
    var root = qs('.designstudio-studio');
    return root ? parseInt(root.getAttribute('data-plan-id') || '0', 10) : 0;
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

  function writeMultiState() {
    var node = qs('#designstudio_multi_state');
    if (!node) return;

    if (!multiMode) {
      node.textContent = 'Multi-sélection inactive.';
      return;
    }

    node.textContent = selectedElements.length + ' objet(s) dans la sélection multiple.';
  }

  function updateMultiButton() {
    var btn = qs('[data-action="multi-toggle"]');
    if (!btn) return;

    btn.textContent = multiMode ? 'Multi-sélection : ON' : 'Multi-sélection : OFF';
    btn.classList.toggle('is-on', multiMode);
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

  function getAttrDeep(el, names) {
    var current = el;
    var guard = 0;

    while (current && current.nodeType === 1 && guard < 8) {
      for (var i = 0; i < names.length; i++) {
        var value = current.getAttribute(names[i]);
        if (value) return value;
      }

      current = current.parentElement;
      guard++;
    }

    return '';
  }

  function getSelectedLinkInfo(el) {
    if (!el) return null;

    if (el.classList.contains('postitdesign-widget') || el.classList.contains('eqLogic-widget')) {
      var eqId = getAttrDeep(el, ['data-eqlogic_id', 'data-eqlogic-id']);
      if (eqId) return { link_type: 'eqLogic', link_id: parseInt(eqId, 10) };
    }

    if (el.classList.contains('cmd-widget')) {
      var cmdId = getAttrDeep(el, ['data-cmd_id', 'data-cmd-id']);
      if (cmdId) return { link_type: 'cmd', link_id: parseInt(cmdId, 10) };
    }

    var fallbackEq = getAttrDeep(el, ['data-eqlogic_id', 'data-eqlogic-id']);
    if (fallbackEq) return { link_type: 'eqLogic', link_id: parseInt(fallbackEq, 10) };

    var fallbackCmd = getAttrDeep(el, ['data-cmd_id', 'data-cmd-id']);
    if (fallbackCmd) return { link_type: 'cmd', link_id: parseInt(fallbackCmd, 10) };

    return null;
  }

  function getElementKey(el) {
    var info = getSelectedLinkInfo(el);
    if (info) return info.link_type + ':' + info.link_id;

    if (!el.getAttribute('data-designstudio-temp-key')) {
      el.setAttribute('data-designstudio-temp-key', 'tmp-' + Math.random().toString(36).slice(2));
    }

    return el.getAttribute('data-designstudio-temp-key');
  }

  function getWidgets(doc) {
    if (!doc) return [];

    return Array.prototype.slice.call(
      doc.querySelectorAll('.postitdesign-widget, .eqLogic-widget, .cmd-widget')
    ).filter(function (el) {
      return el && el.id !== 'designstudio-selection-box' && el.id !== 'designstudio-design-grid';
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

  function findDesignSurface(doc) {
    if (!doc) return null;

    var widgets = getWidgets(doc);
    var candidates = [];
    var viewportW = doc.defaultView.innerWidth || 0;
    var viewportH = doc.defaultView.innerHeight || 0;

    var selectors = [
      '#div_displayObject',
      '.div_displayObject',
      '#div_pageContainer',
      '.div_pageContainer',
      '#div_planContainer',
      '.div_planContainer',
      '.planContainer',
      '#planContainer'
    ];

    selectors.forEach(function (sel) {
      var el = doc.querySelector(sel);
      if (!el) return;

      var r = normalizedRect(el.getBoundingClientRect());
      if (r.width >= 180 && r.height >= 180) {
        candidates.push({ el: el, rect: r, score: 10 });
      }
    });

    Array.prototype.slice.call(doc.querySelectorAll('div')).forEach(function (el) {
      if (!el || el.id === 'designstudio-selection-box' || el.id === 'designstudio-design-grid') return;

      var r = normalizedRect(el.getBoundingClientRect());
      if (r.width < 180 || r.height < 180) return;

      if (viewportW > 0 && viewportH > 0) {
        if (r.width > viewportW * 0.96 && r.height > viewportH * 0.88) return;
      }

      var style = doc.defaultView.getComputedStyle(el);
      var bg = style.backgroundColor || '';
      var hasBg = bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';

      var contained = 0;
      widgets.forEach(function (w) {
        var wr = normalizedRect(w.getBoundingClientRect());
        if (rectContainsCenter(r, wr)) contained++;
      });

      if (widgets.length > 0 && contained === 0) return;

      var score = 1000;
      if (hasBg) score -= 200;
      score -= contained * 80;
      score += Math.round((r.width * r.height) / 10000);

      candidates.push({ el: el, rect: r, score: score });
    });

    candidates.sort(function (a, b) {
      return a.score - b.score;
    });

    if (candidates.length > 0) return candidates[0].rect;

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

  function ensureIframeGrid(doc) {
    var grid = doc.getElementById('designstudio-design-grid');
    if (grid) return grid;

    grid = doc.createElement('div');
    grid.id = 'designstudio-design-grid';
    grid.style.position = 'fixed';
    grid.style.left = '0px';
    grid.style.top = '0px';
    grid.style.width = '0px';
    grid.style.height = '0px';
    grid.style.zIndex = '2147481000';
    grid.style.pointerEvents = 'none';
    grid.style.display = 'none';
    grid.style.boxSizing = 'border-box';
    grid.style.border = '3px solid rgba(47,128,237,.95)';
    grid.style.borderRadius = '4px';
    grid.style.backgroundColor = 'rgba(47,128,237,.08)';
    grid.style.backgroundImage = 'linear-gradient(rgba(47,128,237,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(47,128,237,.45) 1px, transparent 1px)';
    grid.style.backgroundSize = '24px 24px';

    doc.body.appendChild(grid);
    return grid;
  }

  function updateGridBounds() {
    var doc = iframeDocument();
    if (!doc) return false;

    var rect = findDesignSurface(doc);
    var grid = ensureIframeGrid(doc);

    if (!rect || !grid) {
      writeScan('Grille : zone Design introuvable.');
      return false;
    }

    grid.style.left = Math.round(rect.left) + 'px';
    grid.style.top = Math.round(rect.top) + 'px';
    grid.style.width = Math.round(rect.width) + 'px';
    grid.style.height = Math.round(rect.height) + 'px';
    grid.style.display = gridVisible ? 'block' : 'none';

    return true;
  }

  function toggleGrid() {
    var doc = iframeDocument();

    if (!doc) {
      writeScan('Grille : iframe inaccessible.');
      openPanel();
      return;
    }

    gridVisible = !gridVisible;
    var ok = updateGridBounds();
    var grid = ensureIframeGrid(doc);

    if (!ok) {
      gridVisible = false;
      if (grid) grid.style.display = 'none';
      openPanel();
      return;
    }

    if (grid) grid.style.display = gridVisible ? 'block' : 'none';

    writeScan(gridVisible ? 'Grille affichée dans le Design.' : 'Grille masquée.');
    openPanel();
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

  function clearMultiVisual() {
    selectedElements.forEach(function (el) {
      if (!el || !el.style) return;
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  }

  function markMultiVisual() {
    selectedElements.forEach(function (el) {
      if (!el || !el.style) return;
      el.style.outline = '3px dashed #f39c12';
      el.style.outlineOffset = '3px';
    });
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

    if (multiMode && selectedElements.length > 1) {
      writeSelectedHtml(
        '<div class="designstudio-selected-title">Sélection multiple</div>' +
        '<div class="designstudio-kv"><b>Objets</b><span>' + selectedElements.length + '</span></div>' +
        '<div class="designstudio-kv"><b>Action</b><span>Aligner puis Enregistrer sélection.</span></div>'
      );
      return;
    }

    var rect = el.getBoundingClientRect();
    var style = el.ownerDocument.defaultView.getComputedStyle(el);
    var moved = el.getAttribute('data-designstudio-visual-moved') === '1';
    var linkInfo = getSelectedLinkInfo(el);

    var html = '';
    html += '<div class="designstudio-selected-title">Objet sélectionné</div>';
    html += '<div class="designstudio-kv"><b>Type</b><span>' + getWidgetType(el) + '</span></div>';
    html += '<div class="designstudio-kv"><b>Texte</b><span>' + escapeHtml(getCleanText(el) || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Position écran</b><span>x=' + Math.round(rect.left) + ', y=' + Math.round(rect.top) + '</span></div>';
    html += '<div class="designstudio-kv"><b>Taille</b><span>' + Math.round(rect.width) + ' × ' + Math.round(rect.height) + ' px</span></div>';
    html += '<div class="designstudio-kv"><b>CSS left/top</b><span>' + (style.left || '—') + ' / ' + (style.top || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Lien Jeedom</b><span>' + (linkInfo ? linkInfo.link_type + ' #' + linkInfo.link_id : 'Non détecté') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Classes</b><span>' + escapeHtml(el.className || '—') + '</span></div>';
    html += '<div class="designstudio-kv"><b>Déplacé</b><span>' + (moved ? 'Oui, visuel uniquement' : 'Non') + '</span></div>';

    writeSelectedHtml(html);
  }

  function toggleElementInMulti(el) {
    var key = getElementKey(el);
    var index = -1;

    selectedElements.forEach(function (item, i) {
      if (getElementKey(item) === key) index = i;
    });

    if (index >= 0) {
      selectedElements.splice(index, 1);
    } else {
      selectedElements.push(el);
    }

    selectedElement = el;

    clearMultiVisual();
    markMultiVisual();
    updateSelectionBox(el);
    showSelectedInfo(el);
    writeMultiState();
    openPanel();
  }

  function selectElement(el) {
    if (multiMode) {
      toggleElementInMulti(el);
      return;
    }

    clearMultiVisual();
    selectedElements = [el];
    selectedElement = el;
    updateSelectionBox(el);
    showSelectedInfo(el);
    writeMultiState();
    openPanel();
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

    selectionEnabled = true;
    doc.body.setAttribute('data-designstudio-selection-installed', '1');
    doc.body.setAttribute('data-designstudio-left-click-selection', '1');

    try {
      doc.body.style.cursor = 'crosshair';
    } catch (e) {}

    function pickFromEvent(ev) {
      if (!selectionEnabled) return false;

      /*
       * En Studio :
       * - clic gauche / toucher = sélectionner ;
       * - clic droit = bloqué pour éviter le menu Jeedom ;
       * - les doubles événements pointerdown/click/touchend sont filtrés.
       */
      if (ev && ev.type !== 'contextmenu') {
        if (typeof ev.button === 'number' && ev.button !== 0) {
          return false;
        }
      }

      var target = findStudioTarget(ev.target);

      if (!target) {
        if (ev && ev.type === 'contextmenu') {
          stop(ev);
          return false;
        }
        return false;
      }

      var key = getElementKey(target);
      var now = Date.now();

      if (key === lastPickKey && now - lastPickAt < 280) {
        stop(ev);
        return false;
      }

      lastPickKey = key;
      lastPickAt = now;

      stop(ev);
      selectElement(target);

      return false;
    }

    [
      'pointerdown',
      'mousedown',
      'click',
      'touchend',
      'contextmenu'
    ].forEach(function (eventName) {
      try {
        doc.addEventListener(eventName, pickFromEvent, {
          capture: true,
          passive: false
        });
      } catch (e) {
        doc.addEventListener(eventName, pickFromEvent, true);
      }
    });

    writeScan('Mode sélection actif : clic gauche ou toucher pour sélectionner. Clic droit Jeedom bloqué.');
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

  function calculateRelativePosition(el) {
    var doc = iframeDocument();
    if (!doc || !el) return null;

    var surface = findDesignSurface(doc);
    if (!surface) return null;

    var rect = normalizedRect(el.getBoundingClientRect());

    var left = Math.round(rect.left - surface.left);
    var top = Math.round(rect.top - surface.top);

    left = Math.max(0, Math.min(left, Math.round(surface.width - rect.width)));
    top = Math.max(0, Math.min(top, Math.round(surface.height - rect.height)));

    return {
      left: left,
      top: top,
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
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

    if (newLeft < surface.left) clampedDx += surface.left - newLeft;
    if (newRight > surface.right) clampedDx -= newRight - surface.right;
    if (newTop < surface.top) clampedDy += surface.top - newTop;
    if (newBottom > surface.bottom) clampedDy -= newBottom - surface.bottom;

    return {
      dx: clampedDx,
      dy: clampedDy,
      blocked: clampedDx !== dx || clampedDy !== dy
    };
  }

  function applyDelta(el, dx, dy) {
    var clamp = clampDeltaToDesign(el, dx, dy);
    dx = clamp.dx;
    dy = clamp.dy;

    if (dx === 0 && dy === 0) return false;

    var win = el.ownerDocument.defaultView;
    var style = win.getComputedStyle(el);

    if (style.position === 'static') {
      el.style.position = 'relative';
    }

    var left = pxToNumber(style.left, el.offsetLeft || 0);
    var top = pxToNumber(style.top, el.offsetTop || 0);

    el.style.left = Math.round(left + dx) + 'px';
    el.style.top = Math.round(top + dy) + 'px';
    el.setAttribute('data-designstudio-visual-moved', '1');

    return true;
  }

  function nudgeSelected(dx, dy) {
    var targets = multiMode && selectedElements.length > 1 ? selectedElements : [selectedElement];

    targets = targets.filter(Boolean);

    if (!targets.length) {
      writeSelectedHtml('Aucun objet sélectionné. Clique Scan puis sélectionne un objet.');
      openPanel();
      return;
    }

    var moved = 0;

    targets.forEach(function (el) {
      if (applyDelta(el, dx, dy)) moved++;
    });

    if (selectedElement) {
      updateSelectionBox(selectedElement);
      showSelectedInfo(selectedElement);
    }

    updateGridBounds();
    writeScan('Déplacement visuel appliqué à ' + moved + ' objet(s). Non enregistré.');
  }

  function alignSelected(direction) {
    if (!multiMode || selectedElements.length < 2) {
      writeScan('Active Multi-sélection et sélectionne au moins 2 objets.');
      openPanel();
      return;
    }

    var rects = selectedElements.map(function (el) {
      return { el: el, rect: normalizedRect(el.getBoundingClientRect()) };
    });

    var target;

    if (direction === 'left') {
      target = Math.min.apply(null, rects.map(function (x) { return x.rect.left; }));
      rects.forEach(function (x) { applyDelta(x.el, target - x.rect.left, 0); });
    }

    if (direction === 'top') {
      target = Math.min.apply(null, rects.map(function (x) { return x.rect.top; }));
      rects.forEach(function (x) { applyDelta(x.el, 0, target - x.rect.top); });
    }

    if (direction === 'right') {
      target = Math.max.apply(null, rects.map(function (x) { return x.rect.right; }));
      rects.forEach(function (x) { applyDelta(x.el, target - x.rect.right, 0); });
    }

    if (direction === 'bottom') {
      target = Math.max.apply(null, rects.map(function (x) { return x.rect.bottom; }));
      rects.forEach(function (x) { applyDelta(x.el, 0, target - x.rect.bottom); });
    }

    markMultiVisual();

    if (selectedElement) {
      updateSelectionBox(selectedElement);
      showSelectedInfo(selectedElement);
    }

    updateGridBounds();
    writeScan('Alignement "' + direction + '" appliqué à ' + selectedElements.length + ' objet(s). Non enregistré.');
    openPanel();
  }

  function saveElementPosition(el) {
    return new Promise(function (resolve, reject) {
      var linkInfo = getSelectedLinkInfo(el);
      if (!linkInfo || !linkInfo.link_id || !linkInfo.link_type) {
        reject('Lien Jeedom non détecté');
        return;
      }

      var pos = calculateRelativePosition(el);
      if (!pos) {
        reject('Position relative introuvable');
        return;
      }

      $.ajax({
        type: 'POST',
        url: 'plugins/designstudio/core/ajax/designstudio.ajax.php',
        data: {
          action: 'savePosition',
          plan_id: getPlanId(),
          link_type: linkInfo.link_type,
          link_id: linkInfo.link_id,
          left: pos.left,
          top: pos.top,
          width: pos.width,
          height: pos.height
        },
        dataType: 'json',
        cache: false,
        global: false,
        success: function () {
          el.setAttribute('data-designstudio-visual-moved', '0');
          resolve(true);
        },
        error: function (xhr) {
          reject(xhr && xhr.responseText ? xhr.responseText.slice(0, 220) : 'réponse vide');
        }
      });
    });
  }

  function saveTargets(targets, button) {
    targets = targets.filter(Boolean);

    if (!targets.length) {
      writeScan('Aucun objet à enregistrer.');
      openPanel();
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = 'Enregistrement...';
    }

    var saved = 0;

    targets.reduce(function (promise, el) {
      return promise.then(function () {
        return saveElementPosition(el).then(function () {
          saved++;
        });
      });
    }, Promise.resolve()).then(function () {
      if (button) {
        button.disabled = false;
        button.textContent = 'Enregistré';
        window.setTimeout(function () {
          button.textContent = button.getAttribute('data-original-label') || 'Enregistrer';
        }, 1400);
      }

      clearMultiVisual();
      if (multiMode) markMultiVisual();

      if (selectedElement) showSelectedInfo(selectedElement);

      writeScan(saved + ' position(s) enregistrée(s). Reload pour vérifier.');
      openPanel();
    }).catch(function (error) {
      if (button) {
        button.disabled = false;
        button.textContent = 'Erreur';
        window.setTimeout(function () {
          button.textContent = button.getAttribute('data-original-label') || 'Enregistrer';
        }, 1800);
      }

      writeScan('Erreur enregistrement : ' + error);
      openPanel();
    });
  }

  function saveSelectedPosition(btn) {
    saveTargets([selectedElement], btn || qs('[data-action="save-position"]'));
  }

  function saveAllSelected(btn) {
    if (!multiMode || selectedElements.length < 2) {
      writeScan('Active Multi-sélection et sélectionne au moins 2 objets.');
      openPanel();
      return;
    }

    saveTargets(selectedElements, btn || qs('[data-action="save-all"]'));
  }

  function toggleMultiMode() {
    multiMode = !multiMode;

    if (!multiMode) {
      clearMultiVisual();
      selectedElements = selectedElement ? [selectedElement] : [];
    } else {
      selectedElements = selectedElement ? [selectedElement] : [];
      markMultiVisual();
    }

    updateMultiButton();
    writeMultiState();
    showSelectedInfo(selectedElement);
    writeScan(multiMode ? 'Multi-sélection active : clique plusieurs objets.' : 'Multi-sélection désactivée.');
    openPanel();
  }

  function reloadFrame() {
    var iframe = iframeElement();

    if (iframe && iframe.contentWindow) {
      selectedElement = null;
      selectedElements = [];
      gridVisible = false;
      iframe.contentWindow.location.reload();

      window.setTimeout(function () {
        writeScan('Design rechargé. Relance Scan pour sélectionner.');
        writeSelectedHtml('Aucun objet sélectionné.');
        writeMultiState();
      }, 700);
    }
  }

  function bindDock() {
    qsa('[data-action]').forEach(function (btn) {
      if (!btn.getAttribute('data-original-label')) {
        btn.setAttribute('data-original-label', btn.textContent);
      }

      btn.addEventListener('click', function (ev) {
        stop(ev);

        var action = btn.getAttribute('data-action');

        if (action === 'panel') openPanel();
        if (action === 'close') closePanel();
        if (action === 'scan') scanDesign();
        if (action === 'grid') toggleGrid();
        if (action === 'reload') reloadFrame();
        if (action === 'save-position') saveSelectedPosition(btn);
        if (action === 'save-all') saveAllSelected(btn);
        if (action === 'multi-toggle') toggleMultiMode();
        if (action === 'align-left') alignSelected('left');
        if (action === 'align-top') alignSelected('top');
        if (action === 'align-right') alignSelected('right');
        if (action === 'align-bottom') alignSelected('bottom');

        return false;
      }, false);
    });
  }

  function bindNudgeTools() {
    qsa('[data-nudge-dx][data-nudge-dy]').forEach(function (btn) {
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
    updateMultiButton();
    writeMultiState();

    var iframe = iframeElement();

    if (iframe) {
      iframe.addEventListener('load', function () {
        selectedElement = null;
        selectedElements = [];
        gridVisible = false;
        writeScan('Design chargé. Clique Scan pour activer la sélection.');
        writeSelectedHtml('Aucun objet sélectionné.');
        writeMultiState();
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
