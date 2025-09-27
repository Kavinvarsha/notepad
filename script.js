
const editor = document.getElementById("editor");

// Execute formatting commands
function execCmd(command, value = null) {
  document.execCommand(command, false, value);
  editor.focus();
}

// Insert hyperlink
function insertLink() {
  const url = prompt("Enter URL:", "https://");
  if (url) execCmd('createLink', url);
}

// Insert table
function insertTable() {
  const rows = prompt("Rows:", 2);
  const cols = prompt("Columns:", 2);
  if (!rows || !cols) return;

  let table = "<table style='border-collapse: collapse; width: auto;'>";
  for (let i = 0; i < parseInt(rows); i++) {
    table += "<tr>";
    for (let j = 0; j < parseInt(cols); j++) {
      table += "<td style='border:1px solid #d6336c; padding:5px;'>&nbsp;</td>";
    }
    table += "</tr>";
  }
  table += "</table><br>";
  execCmd('insertHTML', table);
}

// Make image draggable inside editor
function makeImageDraggableAndResizable(container) {
  const img = container.querySelector('img');
  const handle = container.querySelector('.resize-handle');

  // Dragging
  let isDragging = false, startX, startY, origX, origY;
  container.addEventListener('mousedown', e => {
    if (e.target === handle) return; // skip dragging while resizing
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = container.getBoundingClientRect();
    origX = rect.left + window.scrollX;
    origY = rect.top + window.scrollY;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    container.style.position = 'relative';
    container.style.left = dx + 'px';
    container.style.top = dy + 'px';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  // Resizing
  let isResizing = false, startWidth, startHeight;
  handle.addEventListener('mousedown', e => {
    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = img.offsetWidth;
    startHeight = img.offsetHeight;
    e.stopPropagation();
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    img.style.width = startWidth + dx + 'px';
    img.style.height = startHeight + dy + 'px';
  });
  document.addEventListener('mouseup', () => { isResizing = false; });
}


// Insert image from URL or local file
function insertImage() {
  const choice = prompt("Insert from URL or local file? (url/file)");
  if (!choice) return;

  const addImageContainer = (src) => {
    const container = document.createElement('span');
    container.className = 'draggable-image';

    const img = document.createElement('img');
    img.src = src;

    const handle = document.createElement('span');
    handle.className = 'resize-handle';

    container.appendChild(img);
    container.appendChild(handle);
    editor.appendChild(container);

    makeImageDraggableAndResizable(container);
  };

  if (choice.toLowerCase() === 'url') {
    const url = prompt("Enter Image URL:");
    if (url) addImageContainer(url);
  } else if (choice.toLowerCase() === 'file') {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => addImageContainer(e.target.result);
      reader.readAsDataURL(file);
    };
    fileInput.click();
  } else alert("Invalid option! Type 'url' or 'file'.");
}

// Auto-save editor
editor.addEventListener("input", () => {
  localStorage.setItem("barbie-richtext", editor.innerHTML);
});

// Load saved content
window.onload = () => {
  editor.innerHTML = localStorage.getItem("barbie-richtext") || "";
};

// New file
document.getElementById("new-btn").addEventListener("click", () => {
  if(editor.innerHTML !== "" && !confirm("Clear current note?")) return;
  editor.innerHTML = "";
  localStorage.removeItem("barbie-richtext");
});

// Open file
const fileInput = document.getElementById("file-input");
document.getElementById("open-btn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    editor.innerHTML = e.target.result;
    localStorage.setItem("barbie-richtext", editor.innerHTML);
  };
  reader.readAsText(file);
});

// Save file (TXT/DOC/PDF)
document.getElementById("save-btn").addEventListener("click", () => {
  const format = prompt("Export as (doc/pdf):", "doc");
  if (!format) return;

  // Prompt for Title & Author
  const title = prompt("Enter document title:", "My Note") || "My Note";
  const author = prompt("Enter author name:", "Anonymous") || "Anonymous";

  const contentHTML = editor.innerHTML;
  const contentText = editor.innerText;

  if (format.toLowerCase() === "doc") {
    // Create Word document
    const blob = new Blob(
      [
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
        </head>
        <body>
        <h1>${title}</h1>
        <p><em>Author: ${author}</em></p>
        ${contentHTML}
        </body>
        </html>`
      ],
      { type: "application/msword" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = title.replace(/\s/g, "_") + ".doc";
    link.click();
    URL.revokeObjectURL(link.href);
    alert("Document exported as Word (.doc)");
  } 
  else if (format.toLowerCase() === "pdf") {
    // Export PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add metadata
    doc.setProperties({
      title: title,
      author: author
    });

    const lines = contentText.split("\n");
    let y = 10;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
    });

    doc.save(title.replace(/\s/g, "_") + ".pdf");
    alert("Document exported as PDF");
  } 
  else {
    alert("Invalid format! Please enter 'doc' or 'pdf'.");
  }
});


// --- Document Operations ---

// Clear formatting
function clearFormatting() {
  document.execCommand('removeFormat', false, null);
  alert("Formatting cleared!");
}

// Reset editor
function resetEditor() {
  if(confirm("Are you sure you want to reset the editor?")) {
    editor.innerHTML = "";
    localStorage.removeItem("barbie-richtext");
  }
}

// Copy plain text
function copyPlainText() {
  navigator.clipboard.writeText(editor.innerText);
  alert("Copied as plain text!");
}

// Copy HTML
function copyHTML() {
  navigator.clipboard.writeText(editor.innerHTML);
  alert("Copied as HTML!");
}

// Preview
function previewContent() {
  const previewWindow = window.open("", "_blank");
  previewWindow.document.write(editor.innerHTML);
  previewWindow.document.close();
}
