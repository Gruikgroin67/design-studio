<?php
try {
    require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }

    ajax::init();

    if (init('action') == 'ping') {
        ajax::success(array(
            'ok' => true,
            'plugin' => 'designstudio',
            'message' => 'AJAX Design Studio OK',
            'time' => date('Y-m-d H:i:s')
        ));
    }

    throw new Exception(__('Aucune méthode correspondante', __FILE__) . ' : ' . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
