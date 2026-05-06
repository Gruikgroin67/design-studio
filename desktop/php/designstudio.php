<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
?>

<div class="designstudio-admin">
  <h2>Design Studio</h2>

  <div class="designstudio-card">
    <h3>État du plugin</h3>
    <p>Socle actif. Aucun Design n’est modifié à cette étape.</p>
    <button type="button" class="btn btn-success" id="bt_designstudio_ping">
      Test AJAX tactile
    </button>
    <pre id="designstudio_result" class="designstudio-result">En attente...</pre>
  </div>
</div>

<link rel="stylesheet" href="plugins/designstudio/desktop/css/designstudio.css">
<script src="plugins/designstudio/desktop/js/designstudio.js"></script>
