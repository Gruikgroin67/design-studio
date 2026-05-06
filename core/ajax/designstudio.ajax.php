<?php
try {
    require_once dirname(__FILE__) . '/../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }

    ajax::success();
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
