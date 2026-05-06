<?php
try {
    require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }

    ajax::init();

    if (init('action') == 'setOverlayEnabled') {
        $enabled = intval(init('enabled')) == 1 ? 1 : 0;
        config::save('overlay_enabled', $enabled, 'designstudio');

        ajax::success(array(
            'ok' => true,
            'overlay_enabled' => $enabled
        ));
    }

    if (init('action') == 'getOverlayState') {
        ajax::success(array(
            'ok' => true,
            'overlay_enabled' => intval(config::byKey('overlay_enabled', 'designstudio', 1))
        ));
    }

    throw new Exception(__('Aucune méthode correspondante', __FILE__) . ' : ' . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
