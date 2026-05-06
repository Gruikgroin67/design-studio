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
            'mode' => 'studio_page'
        ));
    }

    if (init('action') == 'savePosition') {
        $plan_id = intval(init('plan_id'));
        $link_type = trim(init('link_type'));
        $link_id = intval(init('link_id'));
        $left = intval(init('left'));
        $top = intval(init('top'));

        if ($plan_id <= 0) {
            throw new Exception(__('ID Design invalide', __FILE__));
        }

        if (!in_array($link_type, array('eqLogic', 'cmd'), true)) {
            throw new Exception(__('Type de lien invalide', __FILE__) . ' : ' . $link_type);
        }

        if ($link_id <= 0) {
            throw new Exception(__('ID objet invalide', __FILE__));
        }

        if (!class_exists('plan')) {
            throw new Exception(__('Classe plan introuvable', __FILE__));
        }

        if (!method_exists('plan', 'byLinkTypeLinkId')) {
            throw new Exception(__('Méthode plan::byLinkTypeLinkId introuvable', __FILE__));
        }

        $plans = plan::byLinkTypeLinkId($link_type, $link_id);

        if (!is_array($plans) || count($plans) == 0) {
            throw new Exception(__('Aucune ligne plan trouvée pour cet objet', __FILE__));
        }

        $selectedPlan = null;

        foreach ($plans as $plan) {
            if (!is_object($plan)) {
                continue;
            }

            $candidatePlanHeaderId = 0;

            if (method_exists($plan, 'getPlanHeader_id')) {
                $candidatePlanHeaderId = intval($plan->getPlanHeader_id());
            } elseif (method_exists($plan, 'getPlanHeaderId')) {
                $candidatePlanHeaderId = intval($plan->getPlanHeaderId());
            }

            if ($candidatePlanHeaderId == $plan_id) {
                $selectedPlan = $plan;
                break;
            }

            if ($selectedPlan === null && $candidatePlanHeaderId == 0) {
                $selectedPlan = $plan;
            }
        }

        if (!is_object($selectedPlan)) {
            throw new Exception(__('Objet trouvé, mais pas dans ce Design', __FILE__));
        }

        $oldLeft = null;
        $oldTop = null;

        if (method_exists($selectedPlan, 'getPosition')) {
            $getRef = new ReflectionMethod($selectedPlan, 'getPosition');
            if ($getRef->getNumberOfParameters() >= 1) {
                $oldLeft = $selectedPlan->getPosition('left');
                $oldTop = $selectedPlan->getPosition('top');
            } else {
                $oldPosition = $selectedPlan->getPosition();
                if (is_array($oldPosition)) {
                    $oldLeft = isset($oldPosition['left']) ? $oldPosition['left'] : null;
                    $oldTop = isset($oldPosition['top']) ? $oldPosition['top'] : null;
                }
            }
        }

        if (!method_exists($selectedPlan, 'setPosition')) {
            throw new Exception(__('Méthode setPosition introuvable sur plan', __FILE__));
        }

        $setRef = new ReflectionMethod($selectedPlan, 'setPosition');

        if ($setRef->getNumberOfParameters() >= 2) {
            $selectedPlan->setPosition('left', $left);
            $selectedPlan->setPosition('top', $top);
        } else {
            $position = array();

            if (method_exists($selectedPlan, 'getPosition')) {
                $getRef = new ReflectionMethod($selectedPlan, 'getPosition');
                if ($getRef->getNumberOfParameters() == 0) {
                    $currentPosition = $selectedPlan->getPosition();
                    if (is_array($currentPosition)) {
                        $position = $currentPosition;
                    }
                }
            }

            $position['left'] = $left;
            $position['top'] = $top;
            $selectedPlan->setPosition($position);
        }

        $selectedPlan->save();

        ajax::success(array(
            'ok' => true,
            'saved' => true,
            'plan_id' => $plan_id,
            'plan_row_id' => method_exists($selectedPlan, 'getId') ? $selectedPlan->getId() : null,
            'link_type' => $link_type,
            'link_id' => $link_id,
            'old_left' => $oldLeft,
            'old_top' => $oldTop,
            'left' => $left,
            'top' => $top
        ));
    }

    throw new Exception(__('Aucune méthode correspondante', __FILE__) . ' : ' . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
