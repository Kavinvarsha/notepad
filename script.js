const editor = document.getElementById("editor");

// Formatting commands
function execCmd(command, value = null) {
  document.execCommand(command, false, value);
  editor.focus();
}

// Insert Hyperlink
function insertLink() {
  const url = prompt("Enter URL:", "https://");
  if (url) execCmd('createLink', url);
}

// Insert Table
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

// Make image draggable
function makeImageDraggable(div) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  div.addEventListener('mousedown', (e) => {
    // Prevent drag if resizing (check if near edges)
    const rect = div.getBoundingClientRect();
    if (
      e.offsetX > rect.width - 10 || e.offsetY > rect.height - 10
    ) return; // user is resizing

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = div.offsetLeft;
    startTop = div.offsetTop;
    div.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    div.style.left = startLeft + dx + 'px';
    div.style.top = startTop + dy + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      div.style.zIndex = 'auto';
    }
  });
}


// Insert Image
function insertImage() {
  const choice = prompt("Insert from URL or local file? (url/file)");
  if (!choice) return;

  const addImageDiv = (src) => {
    const div = document.createElement('div');
    div.className = 'resizable-draggable';
    div.style.left = '50px';
    div.style.top = '50px';
    const img = document.createElement('img');
    img.src = src;
    div.appendChild(img);
    editor.appendChild(div);
    makeImageDraggable(div);
  };

  if (choice.toLowerCase() === 'url') {
    const url = prompt("Enter Image URL:");
    if (url) addImageDiv(url);
  } else if (choice.toLowerCase() === 'file') {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => addImageDiv(e.target.result);
      reader.readAsDataURL(file);
    };
    fileInput.click();
  } else {
    alert("Invalid option! Type 'url' or 'file'.");
  }
}


// Auto-save
editor.addEventListener("input", () => {
  localStorage.setItem("barbie-richtext", editor.innerHTML);
});

// Load saved
window.onload = () => {
  editor.innerHTML = localStorage.getItem("barbie-richtext") || "";
};

// New
document.getElementById("new-btn").addEventListener("click", () => {
  if(editor.innerHTML !== "" && !confirm("Clear current note?")) return;
  editor.innerHTML = "";
  localStorage.removeItem("barbie-richtext");
});

// Open
const fileInput = document.getElementById("file-input");
document.getElementById("open-btn").addEventListener("click", () => {
  fileInput.click();
});
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

// Save TXT/DOC/PDF
document.getElementById("save-btn").addEventListener("click", () => {
  const format = prompt("Save as (txt/pdf/doc):", "txt");
  if(!format) return;

  const content = editor.innerHTML;

  if(format.toLowerCase() === "txt" || format.toLowerCase() === "doc") {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = format.toLowerCase() === "txt" ? "note.txt" : "note.doc";
    link.click();
    URL.revokeObjectURL(link.href);
  } else if(format.toLowerCase() === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = editor.innerText.split("\n");
    let y = 10;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
    });
    doc.save("note.pdf");
  } else {
    alert("Invalid format! Use txt, pdf, or doc.");
  }
});
