// IMAGE MANAGER
class ImageManager {
  constructor(editor) { this.editor = editor; }

  makeImageDraggableAndResizable(container) {//purpose make image draggable,resizable
    const img = container.querySelector('img');//finds image element inside container
    const handle = container.querySelector('.resize-handle');//find the resize handle inside container

    let isDragging=false, startX, startY;//dragging image and initial mouse positions
    container.addEventListener('mousedown', e=>{
      if(e.target === handle) return;//user clicked resize handle
      isDragging = true;
      startX = e.clientX - container.offsetLeft;
      startY = e.clientY - container.offsetTop;
      container.style.position = "absolute";//to move freely
    });
    document.addEventListener('mousemove', e=>{
      if(!isDragging) return;//prevents movement if the user isn’t dragging
      container.style.left = (e.clientX - startX) + 'px';//move container horizontally following mouse
      container.style.top = (e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', ()=> isDragging=false);//user releases mouse,stop dragging

    let isResizing=false, startWidth, startHeight;//resizing image and initial dimensions
    handle.addEventListener('mousedown', e=>{
      isResizing = true;
      startX = e.clientX; startY = e.clientY;//initial mouse positions 
      startWidth = img.offsetWidth; startHeight = img.offsetHeight;//current image size
      e.stopPropagation(); e.preventDefault();//prevent dragging when resizing
    });
    document.addEventListener('mousemove', e=>{
      if(!isResizing) return;
      img.style.width = (startWidth + e.clientX - startX) + 'px';//new width: initial width + horizontal distance mouse moved.
      img.style.height = (startHeight + e.clientY - startY) + 'px';//new height
    });
    document.addEventListener('mouseup', ()=> isResizing=false);//stop resizing when user releases mouse
  }

  insertImage() {
    const choice = prompt("Insert from URL or local file? (url/file)");
    if(!choice) return;

    const addImageContainer = src => {//small function to take image source and add it in editor
      const container = document.createElement('span');//html container for image+handle
      container.className = "draggable-image";
      const img = document.createElement('img');
      img.src = src;//set image source
      const handle = document.createElement('span');//resize handle
      handle.className = "resize-handle";
      container.appendChild(img); 
      container.appendChild(handle);//add image and handle to container
      this.editor.appendChild(container);//adds the container into the editor, so the image appears on the page.
      this.makeImageDraggableAndResizable(container);//calls the draggable and resizable method
    };

    if(choice.toLowerCase() === "url"){
      const url = prompt("Enter image URL:");
      if(url) addImageContainer(url);//if the user typed something → insert it in editor.
    } else if(choice.toLowerCase() === "file"){
      const fileInput = document.createElement("input");
      fileInput.type="file"; fileInput.accept="image/*";//restrict to image files
      fileInput.onchange = () => {
        const file = fileInput.files[0];//get the first selected file
        if(!file) return;//no file selected ,stop 
        const reader = new FileReader();
        reader.onload = e => addImageContainer(e.target.result);
        reader.readAsDataURL(file);
      };
      fileInput.click();
    } else { alert("Invalid option!"); }
  }
}

// STORAGE 
class StorageManager{
  static save(editor){ localStorage.setItem('barbie-richtext', editor.innerHTML);}//localstorage lets store data in browser
  static load(editor){ editor.innerHTML=localStorage.getItem('barbie-richtext')||"";}//looks for the saved item,if not found return empty string
}

//TOOLBAR 
class Toolbar {
  constructor(editor,imageManager){
    this.editor=editor; this.imageManager=imageManager; 

    // Buttons & Selects
    this.boldBtn = document.getElementById('bold-btn');
    this.italicBtn = document.getElementById('italic-btn');
    this.underlineBtn = document.getElementById('underline-btn');
    this.leftAlignBtn = document.getElementById('left-btn');
    this.centerAlignBtn = document.getElementById('center-btn');
    this.rightAlignBtn = document.getElementById('right-btn');
    this.justifyBtn = document.getElementById('justify-btn');
    this.ulBtn = document.getElementById('ul-btn');
    this.olBtn = document.getElementById('ol-btn');
    this.indentBtn = document.getElementById('indent-btn');
    this.outdentBtn = document.getElementById('outdent-btn');

    this.linkBtn = document.getElementById('link-btn');
    this.tableBtn = document.getElementById('table-btn');
    this.imageBtn = document.getElementById('image-btn');

    this.clearBtn = document.getElementById('clear-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.copyTextBtn = document.getElementById('copy-text-btn');
    this.copyHTMLBtn = document.getElementById('copy-html-btn');
    this.previewBtn = document.getElementById('preview-btn');

    this.newBtn = document.getElementById('new-btn');
    this.openBtn = document.getElementById('open-btn');
    this.saveBtn = document.getElementById('save-btn');
    this.fileInput = document.getElementById('file-input');

    this.fontSizeSelect = document.getElementById('font-size-select');
    this.fontStyleSelect = document.getElementById('font-style-select');
    this.headingsSelect = document.getElementById('headings-select');
    this.textColorPicker = document.getElementById('text-color-picker');
    this.highlightColorPicker = document.getElementById('highlight-color-picker');

   


    this.initEvents();
  }

  execCmd(cmd,value=null){ this.editor.focus(); document.execCommand(cmd,false,value); this.updateToolbarState(); }//Run a command (like bold, italic, insert list) on the selected text.

  updateToolbarState(){
    [['bold',this.boldBtn],['italic',this.italicBtn],['underline',this.underlineBtn],
    ['justifyLeft',this.leftAlignBtn],['justifyCenter',this.centerAlignBtn],['justifyRight',this.rightAlignBtn],
    ['justifyFull',this.justifyBtn],['insertUnorderedList',this.ulBtn],['insertOrderedList',this.olBtn]]
    .forEach(([cmd,btn])=>btn?.classList.toggle('active',document.queryCommandState(cmd)));//returns true if command is active at cursor position

    let block = document.queryCommandValue('formatBlock'); if(block) block=block.replace(/["<>]/g,'').toLowerCase();//Returns current block element 
    if(this.headingsSelect) this.headingsSelect.value = ['h1','h2','h3'].includes(block)? block:'p';//if current block is h1,h2,h3 set it,else set to p
    if(this.fontSizeSelect) this.fontSizeSelect.value = document.queryCommandValue('fontSize')||'3';
    if(this.fontStyleSelect) this.fontStyleSelect.value = document.queryCommandValue('fontName').replace(/["']/g,'')||'Comic Sans MS';
  }

  initEvents(){
    ['keyup','mouseup','focus','blur'].forEach(evt=>this.editor.addEventListener(evt,()=>this.updateToolbarState()));//Whenever user types (keyup), clicks (mouseup), focuses, or blurs editor → update toolbar state.

    this.boldBtn?.addEventListener('click',()=>this.execCmd('bold'));
    this.italicBtn?.addEventListener('click',()=>this.execCmd('italic'));
    this.underlineBtn?.addEventListener('click',()=>this.execCmd('underline'));
    this.leftAlignBtn?.addEventListener('click',()=>this.execCmd('justifyLeft'));
    this.centerAlignBtn?.addEventListener('click',()=>this.execCmd('justifyCenter'));
    this.rightAlignBtn?.addEventListener('click',()=>this.execCmd('justifyRight'));
    this.justifyBtn?.addEventListener('click',()=>this.execCmd('justifyFull'));
    this.ulBtn?.addEventListener('click',()=>this.execCmd('insertUnorderedList'));
    this.olBtn?.addEventListener('click',()=>this.execCmd('insertOrderedList'));
    this.indentBtn?.addEventListener('click',()=>this.execCmd('indent'));
    this.outdentBtn?.addEventListener('click',()=>this.execCmd('outdent'));

    this.fontSizeSelect?.addEventListener('change',()=>this.execCmd('fontSize',this.fontSizeSelect.value));
    this.fontStyleSelect?.addEventListener('change',()=>this.execCmd('fontName',this.fontStyleSelect.value));
    this.headingsSelect?.addEventListener('change',()=>this.execCmd('formatBlock',this.headingsSelect.value));
    this.textColorPicker?.addEventListener('change',()=>this.execCmd('foreColor',this.textColorPicker.value));
    this.highlightColorPicker?.addEventListener('change',()=>this.execCmd('hiliteColor',this.highlightColorPicker.value));

    this.linkBtn?.addEventListener('click',()=>this.insertLink());
    this.tableBtn?.addEventListener('click',()=>this.insertTable());
    this.imageBtn?.addEventListener('click',()=>this.imageManager.insertImage());

    this.clearBtn?.addEventListener('click',()=>this.clearFormatting());
    this.resetBtn?.addEventListener('click',()=>this.resetEditor());
    this.copyTextBtn?.addEventListener('click',()=>this.copyPlainText());
    this.copyHTMLBtn?.addEventListener('click',()=>this.copyHTML());
    this.previewBtn?.addEventListener('click',()=>this.preview());

    this.newBtn?.addEventListener('click',()=>this.newFile());
    this.openBtn?.addEventListener('click',()=>this.fileInput.click());
    this.fileInput?.addEventListener('change',e=>this.openFile(e));
    this.saveBtn?.addEventListener('click',()=>this.saveFile());

    
  }


insertLink(){
    const url = prompt("Enter URL:","https://");
    if(!url) return;

    const selection = document.getSelection();

    if(selection && selection.toString()){
        // If some text is selected, make it a link
        this.execCmd('createLink', url);
    } else {
        // Insert link text as a single node
        const text = prompt("Enter link text:", url);
        if(!text) return;

        const a = document.createElement('a');
        a.href = url;
        a.target = "_blank";
        a.textContent = text;

        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(a);

        // Move cursor after the link
        range.setStartAfter(a);
        range.setEndAfter(a);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}


  insertTable(){
  const rows = parseInt(prompt("Rows:",2));
  const cols = parseInt(prompt("Columns:",2));
  if(!rows||!cols) return;

  // Create a container for the table
  const container = document.createElement("span");
  container.className = "draggable-table";

  // Build table HTML
  let table="<table style='border-collapse:collapse;width:auto;'>";
  for(let i=0;i<rows;i++){
    table+="<tr>";
    for(let j=0;j<cols;j++){ 
      table+="<td style='border:1px solid #d6336c;padding:5px;'>&nbsp;</td>"; 
    }
    table+="</tr>";
  }
  table+="</table>";

  // Insert the table into container
  container.innerHTML = table;

  // Add a resize handle
  const handle = document.createElement("span");
  handle.className = "resize-handle";
  container.appendChild(handle);

  this.editor.appendChild(container);

  // Make the container draggable & resizable
  this.makeTableDraggableAndResizable(container);
}


insertPageBreak() {
  const pageBreak = document.createElement('div');
  pageBreak.className = "page-break";
  pageBreak.dataset.pageBreak = "true"; // used by PDF export
  pageBreak.style.width = "100%";
  pageBreak.style.borderTop = "2px dashed #ff1493";
  pageBreak.style.margin = "15px 0";
  pageBreak.style.textAlign = "center";
  pageBreak.textContent = "— Page Break —";

  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.collapse(false); // insert at cursor
    range.insertNode(pageBreak);
    range.setStartAfter(pageBreak);
    range.setEndAfter(pageBreak);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    this.editor.appendChild(pageBreak);
  }
}
makeTableDraggableAndResizable(container){
  const table = container.querySelector("table");
  const handle = container.querySelector(".resize-handle");

  // --- Dragging ---
  let isDragging = false, startX, startY;
  container.addEventListener("mousedown", e => {
    if(e.target === handle) return; // skip resize handle
    isDragging = true;
    startX = e.clientX - container.offsetLeft;
    startY = e.clientY - container.offsetTop;
    container.style.position = "absolute";
  });

  document.addEventListener("mousemove", e => {
    if(!isDragging) return;
    container.style.left = (e.clientX - startX) + "px";
    container.style.top = (e.clientY - startY) + "px";
  });

  document.addEventListener("mouseup", ()=> isDragging = false);

  // --- Resizing ---
  let isResizing = false, startWidth, startHeight;
  handle.addEventListener("mousedown", e => {
    isResizing = true;
    startX = e.clientX; startY = e.clientY;
    startWidth = table.offsetWidth; startHeight = table.offsetHeight;
    e.stopPropagation(); e.preventDefault();
  });

  document.addEventListener("mousemove", e => {
    if(!isResizing) return;
    table.style.width = (startWidth + e.clientX - startX) + "px";
    table.style.height = (startHeight + e.clientY - startY) + "px";
  });

  document.addEventListener("mouseup", ()=> isResizing = false);
}


saveFile() {
  const format = prompt("Export as (doc/pdf/txt):","doc");
  if (!format) return;

  const title = prompt("Enter title:","My Note") || "My Note";
  const author = prompt("Enter author:","Anonymous") || "Anonymous";
  const contentHTML = this.editor.innerHTML;
  const contentText = this.editor.innerText;

  if (format.toLowerCase() === "pdf") {
    // Use html2pdf.js for proper formatting & page breaks
    const opt = {
      margin:       10,
      filename:     title.replace(/\s/g,"_") + ".pdf",
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'] } // respects .page-break
    };

    // Create a wrapper to include metadata (title/author)
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <h1>${title}</h1>
      <p><em>Author: ${author}</em></p>
      ${contentHTML}
    `;

    html2pdf().from(wrapper).set(opt).save();

  } else if (format.toLowerCase() === "doc") {
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body>
          <h1>${title}</h1>
          <p><em>Author: ${author}</em></p>
          ${contentHTML}
        </body>
      </html>`], { type: "application/msword" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = title.replace(/\s/g,"_") + ".doc";
    link.click();
    URL.revokeObjectURL(link.href);
    alert("Exported as Word (.doc)");

  } else if (format.toLowerCase() === "txt") {
    const blob = new Blob([`Title: ${title}\nAuthor: ${author}\n\n${contentText}`], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = title.replace(/\s/g,"_") + ".txt";
    link.click();
    URL.revokeObjectURL(link.href);
    alert("Exported as TXT");

  } else {
    alert("Invalid format! Use 'doc','pdf', or 'txt'.");
  }
}

}

// INIT 
window.onload = () => {
  const editor = document.getElementById('editor');
  const imageManager = new ImageManager(editor);
  const toolbar = new Toolbar(editor, imageManager);

  StorageManager.load(editor);
  editor.addEventListener('input',()=>StorageManager.save(editor));
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    themeToggleBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // Toggle theme on click
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      body.setAttribute('data-theme', 'light');
      themeToggleBtn.textContent = '🌙 Dark Mode';
      localStorage.setItem('theme', 'light');
    } else {
      body.setAttribute('data-theme', 'dark');
      themeToggleBtn.textContent = '☀️ Light Mode';
      localStorage.setItem('theme', 'dark');
    }
  });
};
