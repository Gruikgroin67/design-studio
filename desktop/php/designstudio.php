<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}

include_file('desktop', 'designstudio', 'css', 'designstudio');
include_file('desktop', 'designstudio', 'js', 'designstudio');

$overlayEnabled = intval(config::byKey('overlay_enabled', 'designstudio', 1));
?>

<div class="designstudio-admin">
  <div class="designstudio-header">
    <h2>Design Studio</h2>
    <p>Surcouche moderne pour les Designs Jeedom.</p>
  </div>

  <div class="designstudio-grid">
    <div class="designstudio-card">
      <h3>Overlay Design</h3>
      <p>Active un dock flottant moderne directement sur les pages Design.</p>

      <button type="button"
              id="bt_designstudio_toggle_overlay"
              class="designstudio-admin-btn <?php echo $overlayEnabled ? 'is-on' : 'is-off'; ?>"
              data-enabled="<?php echo $overlayEnabled; ?>">
        <?php echo $overlayEnabled ? 'Overlay activé' : 'Overlay désactivé'; ?>
      </button>
    </div>

    <div class="designstudio-card">
      <h3>Mode actuel</h3>
      <p>Aucun widget Jeedom n’est créé. Aucun Design n’est modifié.</p>
      <p class="designstudio-muted">Le dock est injecté côté navigateur uniquement sur les pages Design.</p>
    </div>
  </div>
</div>
