<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}

include_file('desktop', 'designstudio', 'css', 'designstudio');
include_file('desktop', 'designstudio_studio', 'js', 'designstudio');

$planId = intval(init('plan_id', 0));
$planName = 'Design';

try {
    if ($planId > 0 && class_exists('planHeader')) {
        $planHeader = planHeader::byId($planId);
        if (is_object($planHeader)) {
            $planName = $planHeader->getName();
        }
    }
} catch (Exception $e) {
}
?>

<div class="designstudio-studio" data-plan-id="<?php echo $planId; ?>">
  <div class="designstudio-studio-topbar">
    <div>
      <strong>Design Studio</strong>
      <span><?php echo htmlspecialchars($planName); ?> — ID <?php echo $planId; ?></span>
    </div>

    <div class="designstudio-studio-actions">
      <a href="index.php?v=d&m=designstudio&p=designstudio" class="designstudio-toplink">Retour</a>
      <a href="index.php?v=d&p=plan&plan_id=<?php echo $planId; ?>" target="_blank" class="designstudio-toplink">Ouvrir normal</a>
    </div>
  </div>

  <div class="designstudio-studio-framewrap">
    <iframe id="designstudio_iframe"
            class="designstudio-iframe"
            src="index.php?v=d&p=plan&plan_id=<?php echo $planId; ?>">
    </iframe>

    <div id="designstudio_grid_overlay" class="designstudio-grid-overlay"></div>
  </div>

  <div class="designstudio-dock">
    <button type="button" class="designstudio-dock-btn" data-action="panel">Studio</button>
    <button type="button" class="designstudio-dock-btn" data-action="scan">Scan</button>
    <button type="button" class="designstudio-dock-btn" data-action="grid">Grille</button>
    <button type="button" class="designstudio-dock-btn" data-action="reload">Reload</button>
  </div>

  <div id="designstudio_panel" class="designstudio-sidepanel">
    <div class="designstudio-sidepanel-head">
      <strong>Design Studio</strong>
      <button type="button" class="designstudio-close" data-action="close">×</button>
    </div>

    <div class="designstudio-sidepanel-body">
      <div class="designstudio-line">Studio actif sur : <?php echo htmlspecialchars($planName); ?></div>
      <div class="designstudio-line" id="designstudio_scan_result">Scan non lancé</div>
      <div class="designstudio-line">Clique Scan, puis clique un objet du Design.</div>

      <div class="designstudio-line designstudio-nudge-block">
        <!-- DESIGNSTUDIO_VISUAL_NUDGE_UI_V2_TOP -->
        <div class="designstudio-tool-title">Déplacement visuel</div>
        <div class="designstudio-nudge-grid">
          <span></span>
          <button type="button" data-nudge-dx="0" data-nudge-dy="-10">↑</button>
          <span></span>

          <button type="button" data-nudge-dx="-10" data-nudge-dy="0">←</button>
          <button type="button" data-action="reload">Annuler</button>
          <button type="button" data-nudge-dx="10" data-nudge-dy="0">→</button>

          <span></span>
          <button type="button" data-nudge-dx="0" data-nudge-dy="10">↓</button>
          <span></span>
        </div>
        <div class="designstudio-nudge-note">Déplacement non enregistré. Annuler recharge le Design.</div>
        <button type="button" class="designstudio-save-position-btn" data-action="save-position">
          Enregistrer position
        </button>
        <!-- DESIGNSTUDIO_SAVE_POSITION_UI_V1 -->
      </div>

      <div class="designstudio-line" id="designstudio_selected_info">Aucun objet sélectionné.</div>
    </div>
  </div>
</div>
