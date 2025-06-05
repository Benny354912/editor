clearConsole()

registerConsoleCommand(
  "Vorschau im neuen Tab öffnen",
  ["vorschau", "preview", "öffne vorschau", "neuer tab"],
  openEditorPreviewTab
);

function openEditorPreviewTab() {
  const raw = localStorage.getItem('editorContent');
  if (!raw) {
    alert("Kein gespeicherter Editor-Inhalt gefunden.");
    return;
  }

  let content;
  try {
    content = JSON.parse(raw);
  } catch {
    alert("Gespeicherter Editor-Inhalt ist ungültig.");
    return;
  }

  const fullHTML = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Vorschau</title>
  <style>${content.css || ''}</style>
</head>
<body>
  ${content.html || ''}
  <script>${content.js || ''}<\/script>
</body>
</html>
`;

  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
