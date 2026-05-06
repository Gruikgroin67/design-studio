<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}

include_file('desktop', 'designstudio', 'css', 'designstudio');
include_file('desktop', 'designstudio', 'js', 'designstudio');
?>

<div class="designstudio-admin">
  <div class="designstudio-header">
    <h2>Design Studio</h2>
    <p>Outils modernes pour les Designs Jeedom.</p>
  </div>

  <div class="designstudio-grid">
    <div class="designstudio-card">
      <h3>Phase actuelle</h3>
      <p>Création du socle plugin. Aucun Design n’est encore modifié.</p>

      <div class="designstudio-status">
        <span class="designstudio-dot"></span>
        Plugin chargé
      </div>
    </div>

    <div class="designstudio-card">
      <h3>Prochaine étape</h3>
      <p>Afficher la liste des Designs Jeedom puis préparer une toolbar isolée.</p>
      <p class="designstudio-muted">On évite les tests visuels parasites. On avance directement sur le vrai moteur.</p>
    </div>
  </div>
</div>
