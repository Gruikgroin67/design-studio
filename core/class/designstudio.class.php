<?php
/* DESIGNSTUDIO_CLASS_V1_NATIVE_TOOLBAR */

class designstudio extends eqLogic {
    public static function ensureToolbarEqLogic($plan_id) {
        $plan_id = intval($plan_id);
        if ($plan_id <= 0) {
            throw new Exception(__('ID Design invalide', __FILE__));
        }

        $logicalId = 'toolbar_' . $plan_id;
        $eqLogic = self::byLogicalId($logicalId, 'designstudio');

        if (!is_object($eqLogic)) {
            $eqLogic = new designstudio();
            $eqLogic->setName('Design Studio - Toolbar ' . $plan_id);
            $eqLogic->setEqType_name('designstudio');
            $eqLogic->setLogicalId($logicalId);
            $eqLogic->setIsEnable(1);
            $eqLogic->setIsVisible(1);
            $eqLogic->setCategory('programming', 1);
        }

        $eqLogic->setConfiguration('plan_id', $plan_id);
        $eqLogic->save();

        $cmd = $eqLogic->getCmd(null, 'open_toolbar');
        if (!is_object($cmd)) {
            $cmd = new designstudioCmd();
            $cmd->setName('Toolbar');
            $cmd->setEqLogic_id($eqLogic->getId());
            $cmd->setLogicalId('open_toolbar');
            $cmd->setType('action');
            $cmd->setSubType('other');
            $cmd->setIsVisible(1);
            $cmd->save();
        }

        return $eqLogic;
    }

    public function toHtml($_version = 'dashboard') {
        $replace = $this->preToHtml($_version);
        if (!is_array($replace)) {
            return $replace;
        }

        $plan_id = intval($this->getConfiguration('plan_id', 0));
        $uid = 'designstudio_toolbar_' . $this->getId() . '_' . $plan_id;

        $html = '';
        $html .= '<div class="designstudio-toolbar-widget" id="' . $uid . '" data-eqlogic-id="' . $this->getId() . '" data-plan-id="' . $plan_id . '">';
        $html .= '<div class="designstudio-toolbar-main">';
        $html .= '<span class="designstudio-toolbar-title">Design Studio</span>';
        $html .= '<button type="button" class="designstudio-toolbar-button">Outils</button>';
        $html .= '</div>';
        $html .= '<div class="designstudio-toolbar-panel">';
        $html .= '<strong>Toolbar active</strong>';
        $html .= '<span>Design ID : ' . $plan_id . '</span>';
        $html .= '<span>Composants à venir.</span>';
        $html .= '</div>';
        $html .= '</div>';

        $replace['#customLayout#'] = true;
        $replace['#_time_widget_#'] = '';
        $replace['#content#'] = $html;

        return $this->postToHtml($_version, template_replace($replace, '<div class="eqLogic eqLogic-widget allowResize allowReorderCmd #custom_layout# #eqLogic_class#" data-eqlogic_id="#id#" data-eqlogic_uid="#uid#" data-version="#version#" style="#style#">#content#</div>'));
    }
}

class designstudioCmd extends cmd {
    public function execute($_options = array()) {
        return true;
    }
}
