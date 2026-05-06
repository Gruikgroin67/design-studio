<?php
if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}

include_file('desktop', 'designstudio', 'css', 'designstudio');
include_file('desktop', 'designstudio', 'js', 'designstudio');
?>

<div class="designstudio-admin">
  <h2>Design Studio</h2>

  <div class="designstudio-card">
    <h3>État du plugin</h3>
    <p>Page admin légère. Aucun Design n’est modifié.</p>

    <button type="button" class="btn btn-primary" id="bt_designstudio_js">
      Test JS local
    </button>

    <button type="button" class="btn btn-success" id="bt_designstudio_ping">
      Test AJAX
    </button>

    <pre id="designstudio_result" class="designstudio-result">Page chargée.</pre>
  </div>
</div>
