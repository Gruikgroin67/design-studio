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
                'name' => $planHeader->getName()
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
    <p>Interface moderne pour travailler sur les Designs Jeedom, sans créer de widget parasite.</p>
  </div>

  <div class="designstudio-grid">
    <div class="designstudio-card">
      <h3>Mode de travail</h3>
      <p>Tu ouvres un Design dans une page Studio dédiée. Le Design original reste intact.</p>
      <div class="designstudio-status">
        <span class="designstudio-dot"></span>
        Aucun widget créé
      </div>
    </div>

    <div class="designstudio-card">
      <h3>Objectif concret</h3>
      <p>Dock moderne, scan des objets, grille visuelle, puis outils de placement.</p>
      <p class="designstudio-muted">On construit une vraie interface, pas une toolbar posée comme équipement.</p>
    </div>
  </div>

  <div class="designstudio-section">
    <div class="designstudio-section-title">
      <h3>Ouvrir un Design dans Studio</h3>
      <span><?php echo count($designs); ?> design(s)</span>
    </div>

    <?php if (count($designs) == 0) { ?>
      <div class="designstudio-empty">Aucun Design détecté.</div>
    <?php } else { ?>
      <div class="designstudio-design-list">
        <?php foreach ($designs as $design) { ?>
          <div class="designstudio-design-card">
            <div>
              <div class="designstudio-design-name"><?php echo htmlspecialchars($design['name']); ?></div>
              <div class="designstudio-design-meta">ID Design : <?php echo intval($design['id']); ?></div>
            </div>

            <div class="designstudio-actions">
              <a class="designstudio-open-link"
                 href="index.php?v=d&m=designstudio&p=studio&plan_id=<?php echo intval($design['id']); ?>">
                Ouvrir Studio
              </a>

              <a class="designstudio-plain-link"
                 href="index.php?v=d&p=plan&plan_id=<?php echo intval($design['id']); ?>"
                 target="_blank">
                Ouvrir normal
              </a>
            </div>
          </div>
        <?php } ?>
      </div>
    <?php } ?>
  </div>
</div>
