<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
?>

<div class="designstudio-admin">
  <h2>Design Studio</h2>
  <p>Socle initial du plugin. Aucun Design n’est encore modifié.</p>
</div>

<link rel="stylesheet" href="plugins/designstudio/desktop/css/designstudio.css">
<script src="plugins/designstudio/desktop/js/designstudio.js"></script>
