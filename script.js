// -------------------- IMAGE MANAGER --------------------
class ImageManager {
  constructor(editor) { this.editor = editor; }

  makeImageDraggableAndResizable(container) {
    const img = container.querySelector('img');
    const handle = container.querySelector('.resize-handle');

    let isDragging=false, startX, startY;
    container.addEventListener('mousedown', e=>{
      if(e.target === handle) return;
      isDragging = true;
      startX = e.clientX - container.offsetLeft;
      startY = e.clientY - container.offsetTop;
      container.style.position = "absolute";
    });
    document.addEventListener('mousemove', e=>{
      if(!isDragging) return;
      container.style.left = (e.clientX - startX) + 'px';
      container.style.top = (e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', ()=> isDragging=false);

    let isResizing=false, startWidth, startHeight;
    handle.addEventListener('mousedown', e=>{
      isResizing = true;
      startX = e.clientX; startY = e.clientY;
      startWidth = img.offsetWidth; startHeight = img.offsetHeight;
      e.stopPropagation(); e.preventDefault();
    });
    document.addEventListener('mousemove', e=>{
      if(!isResizing) return;
      img.style.width = (startWidth + e.clientX - startX) + 'px';
      img.style.height = (startHeight + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', ()=> isResizing=false);
  }

  insertImage() {
    const choice = prompt("Insert from URL or local file? (url/file)");
    if(!choice) return;

    const addImageContainer = src => {
      const container = document.createElement('span');
      container.className = "draggable-image";
      const img = document.createElement('img');
      img.src = src;
      const handle = document.createElement('span');
      handle.className = "resize-handle";
      container.appendChild(img); container.appendChild(handle);
      this.editor.appendChild(container);
      this.makeImageDraggableAndResizable(container);
    };

    if(choice.toLowerCase() === "url"){
      const url = prompt("Enter image URL:");
      if(url) addImageContainer(url);
    } else if(choice.toLowerCase() === "file"){
      const fileInput = document.createElement("input");
      fileInput.type="file"; fileInput.accept="image/*";
      fileInput.onchange = () => {
        const file = fileInput.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = e => addImageContainer(e.target.result);
        reader.readAsDataURL(file);
      };
      fileInput.click();
    } else { alert("Invalid option!"); }
  }
}

// -------------------- DRAWING CANVAS --------------------
class DrawingCanvas {
  constructor(editor, textColorPicker, highlightColorPicker){
    this.editor = editor;
    this.textColorPicker = textColorPicker;
    this.highlightColorPicker = highlightColorPicker;

    this.canvas = document.createElement('canvas');
    this.canvas.id='draw-canvas'; document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.drawing=false; this.currentTool=null; this.lastX=0; this.lastY=0;

    this.resizeCanvas();
    window.addEventListener('resize', ()=>this.resizeCanvas());
    this.initEvents();
  }

  resizeCanvas(){
    this.canvas.width = this.editor.offsetWidth;
    this.canvas.height = this.editor.offsetHeight;
    this.canvas.style.position="absolute";
    this.canvas.style.top=this.editor.offsetTop+"px";
    this.canvas.style.left=this.editor.offsetLeft+"px";
    this.canvas.style.zIndex=-1;
    this.canvas.style.pointerEvents="none";
  }

  setTool(tool){
    this.currentTool = (this.currentTool===tool)? null : tool;
    this.canvas.style.zIndex = this.currentTool? 20:-1;
    this.canvas.style.pointerEvents = this.currentTool? "auto":"none";
  }

  getXY(e){
    if(e.touches) e=e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    return { x:e.clientX-rect.left, y:e.clientY-rect.top };
  }

  startDraw(e){
    if(!this.currentTool) return;
    this.drawing=true;
    const pos = this.getXY(e); this.lastX=pos.x; this.lastY=pos.y;
    e.preventDefault();
  }

  draw(e){
    if(!this.drawing || !this.currentTool) return;
    const pos = this.getXY(e);
    const ctx = this.ctx;

    if(this.currentTool==='highlighter'){ ctx.strokeStyle=this.highlightColorPicker?.value||'#ff66b2'; ctx.lineWidth=15; ctx.globalAlpha=0.3;}
    else if(this.currentTool==='pen'){ ctx.strokeStyle=this.textColorPicker?.value||'#ff1493'; ctx.lineWidth=3; ctx.globalAlpha=1;}
    else if(this.currentTool==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=15;}

    ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(this.lastX,this.lastY); ctx.lineTo(pos.x,pos.y); ctx.stroke();
    this.lastX=pos.x; this.lastY=pos.y; e.preventDefault();
  }

  endDraw(){ this.drawing=false; }

  clearDrawing(){ this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height); }

  initEvents(){
    ['mousedown','touchstart'].forEach(evt => this.canvas.addEventListener(evt,e=>this.startDraw(e)));
    ['mousemove','touchmove'].forEach(evt => this.canvas.addEventListener(evt,e=>this.draw(e)));
    ['mouseup','mouseleave','touchend'].forEach(evt => this.canvas.addEventListener(evt,()=>this.endDraw()));
  }
}

// -------------------- STORAGE --------------------
class StorageManager{
  static save(editor){ localStorage.setItem('barbie-richtext', editor.innerHTML);}
  static load(editor){ editor.innerHTML=localStorage.getItem('barbie-richtext')||"";}
}

// -------------------- TOOLBAR --------------------
class Toolbar {
  constructor(editor,imageManager,drawingCanvas){
    this.editor=editor; this.imageManager=imageManager; this.drawingCanvas=drawingCanvas;

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

    this.penBtn = document.getElementById('pen-btn');
    this.highlighterBtn = document.getElementById('highlighter-btn');
    this.eraserBtn = document.getElementById('eraser-btn');
    this.clearDrawBtn = document.getElementById('clear-draw-btn');
    this.pageBreakBtn = document.getElementById('page-break-btn');



    this.initEvents();
  }

  execCmd(cmd,value=null){ this.editor.focus(); document.execCommand(cmd,false,value); this.updateToolbarState(); }

  updateToolbarState(){
    [['bold',this.boldBtn],['italic',this.italicBtn],['underline',this.underlineBtn],
    ['justifyLeft',this.leftAlignBtn],['justifyCenter',this.centerAlignBtn],['justifyRight',this.rightAlignBtn],
    ['justifyFull',this.justifyBtn],['insertUnorderedList',this.ulBtn],['insertOrderedList',this.olBtn]]
    .forEach(([cmd,btn])=>btn?.classList.toggle('active',document.queryCommandState(cmd)));

    let block = document.queryCommandValue('formatBlock'); if(block) block=block.replace(/["<>]/g,'').toLowerCase();
    if(this.headingsSelect) this.headingsSelect.value = ['h1','h2','h3'].includes(block)? block:'p';
    if(this.fontSizeSelect) this.fontSizeSelect.value = document.queryCommandValue('fontSize')||'3';
    if(this.fontStyleSelect) this.fontStyleSelect.value = document.queryCommandValue('fontName').replace(/["']/g,'')||'Comic Sans MS';
  }

  initEvents(){
    ['keyup','mouseup','focus','blur'].forEach(evt=>this.editor.addEventListener(evt,()=>this.updateToolbarState()));

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

    this.penBtn?.addEventListener('click',()=>this.drawingCanvas.setTool('pen'));
    this.highlighterBtn?.addEventListener('click',()=>this.drawingCanvas.setTool('highlighter'));
    this.eraserBtn?.addEventListener('click',()=>this.drawingCanvas.setTool('eraser'));
    this.clearDrawBtn?.addEventListener('click',()=>this.drawingCanvas.clearDrawing());
    this.pageBreakBtn?.addEventListener('click', () => this.insertPageBreak());
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
    let table="<table style='border-collapse:collapse;width:auto;'>";
    for(let i=0;i<rows;i++){
      table+="<tr>";
      for(let j=0;j<cols;j++){ table+="<td style='border:1px solid #d6336c;padding:5px;'>&nbsp;</td>"; }
      table+="</tr>";
    }
    table+="</table><br>";
    this.execCmd('insertHTML',table);
  }

  clearFormatting(){ this.execCmd('removeFormat'); alert("Formatting cleared!"); }
  resetEditor(){ if(confirm("Reset editor?")){ this.editor.innerHTML=""; localStorage.removeItem("barbie-richtext"); } }
  copyPlainText(){ navigator.clipboard.writeText(this.editor.innerText); alert("Copied as plain text!"); }
  copyHTML(){ navigator.clipboard.writeText(this.editor.innerHTML); alert("Copied as HTML!"); }
  preview(){ const w=window.open(); w.document.write(this.editor.innerHTML); w.document.close(); }

  newFile(){ if(this.editor.innerHTML && !confirm("Clear current note?")) return; this.editor.innerHTML=""; localStorage.removeItem("barbie-richtext"); }
  openFile(e){ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=e=>this.editor.innerHTML=e.target.result; reader.readAsText(file); }

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


// saveFile() {
//   const format = prompt("Export as (doc/pdf/txt):","doc");
//   if(!format) return;

//   const title = prompt("Enter title:","My Note") || "My Note";
//   const author = prompt("Enter author:","Anonymous") || "Anonymous";
//   const contentHTML = this.editor.innerHTML;
//   const contentText = this.editor.innerText;

//   if(format.toLowerCase() === "doc") {
//     // Word export (images will work because <img> is embedded)
//     const blob = new Blob([`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="utf-8">
//           <title>${title}</title>
//         </head>
//         <body>
//           <h1>${title}</h1>
//           <p><em>Author: ${author}</em></p>
//           ${contentHTML}
//         </body>
//       </html>
//     `], { type: "application/msword" });

//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = title.replace(/\s/g, "_") + ".doc";
//     link.click();
//     URL.revokeObjectURL(link.href);
//     alert("Exported as Word (.doc)");

//   } else if(format.toLowerCase() === "pdf") {
//     // PDF export using html2canvas + jsPDF
//     if(!window.jspdf || !window.html2canvas) return alert("jsPDF and html2canvas required!");

//     html2canvas(this.editor, { scale: 2 }).then(canvas => {
//       const imgData = canvas.toDataURL('image/png');
//       const { jsPDF } = window.jspdf;
//       const pdf = new jsPDF('p', 'pt', 'a4');
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgProps = pdf.getImageProperties(imgData);
//       const pdfWidth = pageWidth - 20;
//       const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

//       let heightLeft = pdfHeight;
//       let position = 10;

//       pdf.addImage(imgData, 'PNG', 10, position, pdfWidth, pdfHeight);
//       heightLeft -= pageHeight;

//       while(heightLeft > 0){
//         pdf.addPage();
//         position = 10;
//         pdf.addImage(imgData, 'PNG', 10, position - (pdfHeight - heightLeft), pdfWidth, pdfHeight);
//         heightLeft -= pageHeight;
//       }

//       pdf.save(title.replace(/\s/g, "_") + ".pdf");
//       alert("Exported as PDF");
//     });

//   } else if(format.toLowerCase() === "txt") {
//     const blob = new Blob([`Title: ${title}\nAuthor: ${author}\n\n${contentText}`], { type: "text/plain" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = title.replace(/\s/g, "_") + ".txt";
//     link.click();
//     URL.revokeObjectURL(link.href);
//     alert("Exported as TXT");

//   } else {
//     alert("Invalid format! Use 'doc','pdf', or 'txt'.");
//   }
// }
saveFile() {
  const format = prompt("Export as (doc/pdf/txt):","doc");
  if (!format) return;

  const title = prompt("Enter title:","My Note") || "My Note";
  const author = prompt("Enter author:","Anonymous") || "Anonymous";
  const contentHTML = this.editor.innerHTML;
  const contentText = this.editor.innerText;

  if (format.toLowerCase() === "pdf") {
    // ✅ Use html2pdf.js for proper formatting & page breaks
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

// -------------------- INIT --------------------
window.onload = () => {
  const editor = document.getElementById('editor');
  const imageManager = new ImageManager(editor);
  const drawingCanvas = new DrawingCanvas(editor, document.getElementById('text-color-picker'), document.getElementById('highlight-color-picker'));
  const toolbar = new Toolbar(editor,imageManager,drawingCanvas);

  StorageManager.load(editor);
  editor.addEventListener('input',()=>StorageManager.save(editor));
};
