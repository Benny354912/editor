// === bundle-page.js ===

const originalToggle = dom.menuToggle.onclick;
dom.menuToggle.onclick = () => {
    initBundlePage();
    originalToggle();
};

function initBundlePage() {
    populateProjectSelect();
    // Reset Source View
    document.querySelector('input[name="bundleSource"][value="upload"]').checked = true;
    updateSourceView();
}

// Neue Seite im Modal-Menü
addMenuPage("bundleTab", "Bundler", `
  <div class="bundle-wrapper card">
    <h2>HTML/CSS/JS Bundler</h2>
    <p class="description">Quelle wählen, Dateien konfigurieren und zusammenführen.</p>

    <div class="section toggle-group">
      <label><input type="radio" name="bundleSource" value="upload" checked> Upload</label>
      <label><input type="radio" name="bundleSource" value="project"> Projekt-Dateien</label>
    </div>

    <div id="bundleUploadSection" class="section">
      <div id="bundleDropZone" class="drop-zone">
        <p>Dateien hierher ziehen oder klicken</p>
        <input type="file" id="bundleUploadInput" multiple accept=".html,.htm,.css,.js">
      </div>
      <p class="hint">Nur HTML, CSS, JS</p>
    </div>

    <div id="bundleProjectSection" class="section hidden">
      <label>Projekt:</label>
      <select id="bundleProjectSelect"></select>
    </div>

    <div id="bundleFilesSection" class="section hidden">
      <label>HTML-Datei:</label>
      <select id="bundleHtmlFile"></select>
      <div class="file-group">
        <h4>CSS-Dateien</h4>
        <div id="bundleCssList" class="file-checkboxes"></div>
      </div>
      <div class="file-group">
        <h4>JS-Dateien</h4>
        <div id="bundleJsList" class="file-checkboxes"></div>
      </div>
    </div>

    <div class="section export-group">
      <label><input type="checkbox" id="bundleExportProject"> In Projekt speichern</label>
      <label><input type="checkbox" id="bundleExportDownload" checked> Als Download</label>
      <div id="bundleProjectTargetWrap" class="hidden inline-block">
        <label>Ziel-Projekt:</label>
        <select id="bundleProjectTarget"></select>
      </div>
    </div>

    <button id="bundleConfirmBtn" class="btn primary">Bundle erstellen</button>
  </div>

  <style>
    /* Card */
    .card { background:#fff; padding:1.5rem; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.05); }
    .bundle-wrapper { font-family:'Segoe UI',sans-serif; color:#333; }
    h2 { font-size:1.6rem; margin-bottom:0.5rem; }
    .description { font-size:0.9rem; color:#666; margin-bottom:1rem; }
    .section { margin-bottom:1.5rem; }
    .toggle-group label { margin-right:1.5rem; font-weight:500; }
    .drop-zone { border:2px dashed #aaa; border-radius:6px; padding:1.2rem; text-align:center; background:#f9f9f9; transition:0.2s; cursor:pointer; }
    .drop-zone.highlight { border-color:#5c9ded; background:#e6f0fe; }
    .hint { font-size:0.8rem; color:#999; margin-top:0.5rem; }
    .file-group h4 { font-size:1rem; margin-bottom:0.5rem; }
    .file-checkboxes label { display:block; margin:0.3rem 0; font-size:0.9rem; }
    .export-group label { margin-right:1rem; font-weight:500; }
    .inline-block { display:inline-flex; align-items:center; }
    select { margin-left:0.5rem; padding:0.3rem; border:1px solid #ccc; border-radius:4px; }
    .btn.primary { background:#5c9ded; color:#fff; padding:0.6rem 1.2rem; border:none; border-radius:4px; font-size:1rem; cursor:pointer; }
    .btn.primary:hover { background:#4a8ad4; }
  </style>
`);

const domBundle = {
    dropZone: document.getElementById("bundleDropZone"),
    uploadInput: document.getElementById("bundleUploadInput"),
    projectSelect: document.getElementById("bundleProjectSelect"),
    htmlSelect: document.getElementById("bundleHtmlFile"),
    cssList: document.getElementById("bundleCssList"),
    jsList: document.getElementById("bundleJsList"),
    confirmBtn: document.getElementById("bundleConfirmBtn"),
    projectTarget: document.getElementById("bundleProjectTarget"),
    projectTargetWrap: document.getElementById("bundleProjectTargetWrap"),
    uploadSection: document.getElementById("bundleUploadSection"),
    projectSection: document.getElementById("bundleProjectSection"),
    filesSection: document.getElementById("bundleFilesSection"),
};

let bundleFiles = [];

// Quelle umschalten
function updateSourceView() {
    const src = document.querySelector("input[name=bundleSource]:checked").value;
    const isUpload = src === "upload";
    domBundle.uploadSection.classList.toggle("hidden", !isUpload);
    domBundle.projectSection.classList.toggle("hidden", isUpload);
    domBundle.filesSection.classList.add("hidden");
    bundleFiles = [];
    updateFileUI();
    if (!isUpload) loadProjectFiles();
}
document.querySelectorAll("input[name=bundleSource]").forEach(r => r.addEventListener("change", updateSourceView));

// Projekte befüllen
function populateProjectSelect() {
    const projs = Storage.getProjects();
    domBundle.projectSelect.innerHTML = domBundle.projectTarget.innerHTML = '';
    projs.forEach(p => {
        const opt = new Option(p, p);
        domBundle.projectSelect.append(opt.cloneNode(true));
        domBundle.projectTarget.append(opt.cloneNode(true));
    });
}
populateProjectSelect();

domBundle.projectSelect.addEventListener("change", loadProjectFiles);
document.getElementById("bundleExportProject").addEventListener("change", e => {
    domBundle.projectTargetWrap.classList.toggle("hidden", !e.target.checked);
});

// Projekt-Dateien laden
function loadProjectFiles() {
    const proj = domBundle.projectSelect.value;
    bundleFiles = Storage.getFiles(proj)
        .filter(f => /\.(html?|css|js)$/i.test(f))
        .map(f => ({ name: f, content: Storage.getFileContent(proj, f) }));
    domBundle.filesSection.classList.remove("hidden");
    updateFileUI();
}

// Upload behandeln
function handleBundleUpload(files) {
    const valid = Array.from(files).filter(f => /\.(html?|css|js)$/i.test(f.name));
    Promise.all(valid.map(f => f.text().then(c => ({ name: f.name, content: c })))).then(res => {
        bundleFiles = res; domBundle.filesSection.classList.remove("hidden"); updateFileUI();
    });
}

domBundle.dropZone.addEventListener("click", () => domBundle.uploadInput.click());
domBundle.uploadInput.addEventListener("change", e => handleBundleUpload(e.target.files));
['dragenter', 'dragover'].forEach(evt => domBundle.dropZone.addEventListener(evt, e => { e.preventDefault(); domBundle.dropZone.classList.add('highlight'); }));
['dragleave', 'drop'].forEach(evt => domBundle.dropZone.addEventListener(evt, e => { e.preventDefault(); domBundle.dropZone.classList.remove('highlight'); }));
domBundle.dropZone.addEventListener("drop", e => handleBundleUpload(e.dataTransfer.files));

// UI aktualisieren
function updateFileUI() {
    const htmls = bundleFiles.filter(f => /\.(html?|htm)$/i.test(f.name));
    const css = bundleFiles.filter(f => /\.css$/i.test(f.name));
    const js = bundleFiles.filter(f => /\.js$/i.test(f.name));
    domBundle.htmlSelect.innerHTML = htmls.map(f => `<option>${f.name}</option>`).join('');
    domBundle.cssList.innerHTML = css.map(f => `<label><input type="checkbox" value="${f.name}" checked> ${f.name}</label>`).join('');
    domBundle.jsList.innerHTML = js.map(f => `<label><input type="checkbox" value="${f.name}" checked> ${f.name}</label>`).join('');
}

// Bundle erstellen
// === bundle-page.js ===

// ... (alle bisherigen Code-Blöcke bleiben unverändert)

// Bundle erstellen

domBundle.confirmBtn.addEventListener("click", () => {
  const htmlName = domBundle.htmlSelect.value;
  const cssNames = Array.from(domBundle.cssList.querySelectorAll("input:checked")).map(el => el.value);
  const jsNames = Array.from(domBundle.jsList.querySelectorAll("input:checked")).map(el => el.value);
  const htmlFile = bundleFiles.find(f => f.name === htmlName);
  if (!htmlFile) return alert("Keine gültige HTML-Datei ausgewählt.");
  let html = htmlFile.content;

  const styleBlock = cssNames.map(name => {
    const f = bundleFiles.find(x => x.name === name);
  }).join('');

  const scriptBlock = jsNames.map(name => {
    const f = bundleFiles.find(x => x.name === name);
    return f ? `<script>\n${f.content}\n</script>` : '';
  }).join('');

  const hasHtml = /<html[^>]*>/i.test(html);
  const hasHead = /<head>/i.test(html);
  const hasBody = /<body[^>]*>/i.test(html);

  if (!hasHtml) {
    html = styleBlock + html + scriptBlock;
  } else {
    if (!hasHead) html = html.replace(/<html[^>]*>/i, m => `${m}<head></head>`);
    if (hasHead) {
      html = html.replace(/<\/head>/i, styleBlock + '</head>');
    } else {
      html = styleBlock + html;
    }

    if (hasBody) {
      html = html.replace(/<\/body>/i, scriptBlock + '</body>');
    } else {
      html = html.replace(/<\/html>/i, scriptBlock + '</html>');
    }
  }

  const doDownload = document.getElementById("bundleExportDownload").checked;
  const doProjectSave = document.getElementById("bundleExportProject").checked;
  const defaultFileName = htmlName.replace(/\.(html?|htm)$/i, "_bundle.html");

  if (!doDownload && !doProjectSave) return alert("Bitte mindestens eine Exportoption wählen.");

  if (doProjectSave) {
    const selectedProject = domBundle.projectTarget.value;
    if (!selectedProject) return alert("Kein Projektziel ausgewählt.");

    let fileName = prompt("Dateiname für das Bundle im Projekt:", defaultFileName);
    if (!fileName || !fileName.trim()) return alert("Ungültiger Dateiname.");

    const projectFiles = Storage.getFiles(selectedProject);
    while (projectFiles.includes(fileName)) {
      const overwrite = confirm(`Datei \"${fileName}\" existiert bereits. Überschreiben?`);
      if (overwrite) break;
      const newName = prompt("Bitte neuen Dateinamen eingeben:", fileName);
      if (!newName || !newName.trim()) {
        alert("Überschreiben wird durchgeführt.");
        break;
      }
      fileName = newName;
    }

    Storage.addFile(selectedProject, fileName);
    Storage.setFileContent(selectedProject, fileName, html);
    showAlert("Bundle im Projekt gespeichert.", "success");
    renderAll();
  }

  if (doDownload) {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = defaultFileName;
    a.click();
  }
});


// Kommando registrieren
CommandManager.registerCommand({
    triggers: ['bundle'], args: { required: false }, description: 'Bundler öffnen', callback: () => {
        initBundlePage();
        dom.menuModal.classList.remove('hidden');
        document.querySelector('.modal-nav-item[data-tab="bundleTab"]').click();
    }
});

