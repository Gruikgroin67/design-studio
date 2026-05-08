<?php
try {
    require_once dirname(__FILE__) . '/../../../../core/php/core.inc.php';
    include_file('core', 'authentification', 'php');

    if (!isConnect('admin')) {
        throw new Exception(__('401 - Accès non autorisé', __FILE__));
    }

    ajax::init();

    /* DESIGNSTUDIO_SAVE_POSITION_FORCE_PERSIST_V1 */
    if (!function_exists('designstudio_savepos_log')) {
        function designstudio_savepos_log($message, $context = array()) {
            $line = '[' . date('c') . '] ' . $message;
            if (is_array($context) && count($context) > 0) {
                $line .= ' ' . json_encode($context, JSON_UNESCAPED_UNICODE);
            }
            @file_put_contents('/tmp/designstudio_save_position.log', $line . PHP_EOL, FILE_APPEND);
        }
    }

    if (!function_exists('designstudio_plan_position_array')) {
        function designstudio_plan_position_array($plan) {
            if (!is_object($plan) || !method_exists($plan, 'getPosition')) {
                return array();
            }

            try {
                $ref = new ReflectionMethod($plan, 'getPosition');

                if ($ref->getNumberOfRequiredParameters() == 0) {
                    $raw = $plan->getPosition();
                    if (is_array($raw)) {
                        return $raw;
                    }
                }

                $position = array();
                foreach (array('left', 'top', 'width', 'height') as $key) {
                    try {
                        $value = $plan->getPosition($key);
                        if ($value !== null && $value !== '') {
                            $position[$key] = $value;
                        }
                    } catch (Exception $e) {
                    }
                }

                return $position;
            } catch (Exception $e) {
                return array();
            }
        }
    }

    if (!function_exists('designstudio_set_plan_xy')) {
        function designstudio_set_plan_xy($plan, $left, $top) {
            if (!is_object($plan) || !method_exists($plan, 'setPosition')) {
                throw new Exception(__('Méthode setPosition introuvable sur plan', __FILE__));
            }

            $position = designstudio_plan_position_array($plan);
            $position['left'] = intval($left);
            $position['top'] = intval($top);

            $ref = new ReflectionMethod($plan, 'setPosition');

            if ($ref->getNumberOfParameters() >= 2) {
                $plan->setPosition('left', intval($left));
                $plan->setPosition('top', intval($top));
            } else {
                $plan->setPosition($position);
            }

            return $position;
        }
    }

    if (!function_exists('designstudio_force_db_position')) {
        function designstudio_force_db_position($planRowId, $position) {
            if ($planRowId <= 0 || !class_exists('DB')) {
                return false;
            }

            $position['left'] = intval($position['left']);
            $position['top'] = intval($position['top']);

            DB::Prepare(
                'UPDATE plan SET position = :position WHERE id = :id',
                array(
                    'position' => json_encode($position, JSON_UNESCAPED_UNICODE),
                    'id' => intval($planRowId)
                ),
                DB::FETCH_TYPE_ROW
            );

            return true;
        }
    }



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

        designstudio_savepos_log('REQUEST', array(
            'plan_id' => $plan_id,
            'link_type' => $link_type,
            'link_id' => $link_id,
            'left' => $left,
            'top' => $top
        ));

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

        $planRowId = method_exists($selectedPlan, 'getId') ? intval($selectedPlan->getId()) : 0;
        $oldPosition = designstudio_plan_position_array($selectedPlan);

        $newPosition = designstudio_set_plan_xy($selectedPlan, $left, $top);
        $selectedPlan->save();

        $savedPlan = $selectedPlan;
        if ($planRowId > 0 && method_exists('plan', 'byId')) {
            $reloaded = plan::byId($planRowId);
            if (is_object($reloaded)) {
                $savedPlan = $reloaded;
            }
        }

        $savedPosition = designstudio_plan_position_array($savedPlan);
        $savedLeft = isset($savedPosition['left']) ? intval($savedPosition['left']) : null;
        $savedTop = isset($savedPosition['top']) ? intval($savedPosition['top']) : null;

        $forcedDb = false;

        if ($savedLeft !== intval($left) || $savedTop !== intval($top)) {
            $forcedDb = designstudio_force_db_position($planRowId, $newPosition);

            if ($forcedDb && method_exists('plan', 'byId')) {
                $reloadedAfterDb = plan::byId($planRowId);
                if (is_object($reloadedAfterDb)) {
                    $savedPosition = designstudio_plan_position_array($reloadedAfterDb);
                    $savedLeft = isset($savedPosition['left']) ? intval($savedPosition['left']) : null;
                    $savedTop = isset($savedPosition['top']) ? intval($savedPosition['top']) : null;
                }
            }
        }

        designstudio_savepos_log('RESULT', array(
            'plan_row_id' => $planRowId,
            'old_position' => $oldPosition,
            'new_position' => $newPosition,
            'saved_position' => $savedPosition,
            'forced_db' => $forcedDb
        ));

        if ($savedLeft !== intval($left) || $savedTop !== intval($top)) {
            throw new Exception(__('Position non persistée après sauvegarde', __FILE__) . ' : attendu left=' . $left . ', top=' . $top . ', obtenu left=' . $savedLeft . ', top=' . $savedTop);
        }

        ajax::success(array(
            'ok' => true,
            'saved' => true,
            'forced_db' => $forcedDb,
            'plan_id' => $plan_id,
            'plan_row_id' => $planRowId,
            'link_type' => $link_type,
            'link_id' => $link_id,
            'old_position' => $oldPosition,
            'left' => $left,
            'top' => $top,
            'saved_position' => $savedPosition
        ));
    }

    throw new Exception(__('Aucune méthode correspondante', __FILE__) . ' : ' . init('action'));
} catch (Exception $e) {
    ajax::error(displayException($e), $e->getCode());
}
