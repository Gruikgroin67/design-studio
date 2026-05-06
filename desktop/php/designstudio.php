<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}

include_file('desktop', 'designstudio', 'css', 'designstudio');
include_file('desktop', 'designstudio', 'js', 'designstudio');

$designs = array();

try {
    if (class_exists('planHeader')) {
        foreach (planHeader::all() as $planHeader) {
            $designs[] = array(
                'id' => $planHeader->getId(),
                'name' => $planHeader->getName(),
                'configuration' => $planHeader->getConfiguration()
            );
        }
    }
} catch (Exception $e) {
    $designs = array();
}
?>

<div class="designstudio-admin">
  <div class="designstudio-header">
    <h2>Design Studio</h2>
    <p>Outils modernes pour les Designs Jeedom.</p>
  </div>

  <div class="designstudio-grid">
    <div class="designstudio-card">
      <h3>Phase actuelle</h3>
      <p>Lecture des Designs Jeedom en mode sécurisé. Aucun Design n’est modifié.</p>

      <div class="designstudio-status">
        <span class="designstudio-dot"></span>
        Plugin chargé
      </div>
    </div>

    <div class="designstudio-card">
      <h3>Prochaine étape</h3>
      <p>Préparer une toolbar isolée par Design, sans toucher aux objets existants.</p>
      <p class="designstudio-muted">La toolbar sera activable uniquement sur un Design choisi.</p>
    </div>
  </div>

  <div class="designstudio-section">
    <div class="designstudio-section-title">
      <h3>Designs détectés</h3>
      <span><?php echo count($designs); ?> design(s)</span>
    </div>

    <?php if (count($designs) == 0) { ?>
      <div class="designstudio-empty">
        Aucun Design détecté ou lecture impossible.
      </div>
    <?php } else { ?>
      <div class="designstudio-design-list">
        <?php foreach ($designs as $design) { ?>
          <div class="designstudio-design-card" data-plan-id="<?php echo $design['id']; ?>">
            <div class="designstudio-design-main">
              <div class="designstudio-design-name">
                <?php echo htmlspecialchars($design['name']); ?>
              </div>
              <div class="designstudio-design-meta">
                ID Design : <?php echo $design['id']; ?>
              </div>
            </div>

            <a class="designstudio-open-link"
               href="index.php?v=d&p=plan&plan_id=<?php echo $design['id']; ?>"
               target="_blank">
              Ouvrir
            </a>
          </div>
        <?php } ?>
      </div>
    <?php } ?>
  </div>
</div>
