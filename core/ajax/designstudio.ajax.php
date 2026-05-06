<?php
try {
    require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }

    ajax::init();

    if (init('action') == 'prepareToolbar') {
        $plan_id = intval(init('plan_id'));
        if ($plan_id <= 0) {
            throw new Exception(__('ID Design invalide', __FILE__));
        }

        config::save('toolbar_prepared_' . $plan_id, 1, 'designstudio');

        ajax::success(array(
            'ok' => true,
            'plan_id' => $plan_id,
            'prepared' => true
        ));
    }

    throw new Exception(__('Aucune méthode correspondante', __FILE__) . ' : ' . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
