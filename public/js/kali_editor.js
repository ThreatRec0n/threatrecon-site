// kali_editor.js - Nano-style text editor
(function() {
  'use strict';

  window.kali_editor = {
    active: false,
    
    start(filename, node, interpreter, term) {
      this.active = true;
      this.filename = filename;
      this.node = node;
      this.interpreter = interpreter;
      this.term = term;
      
      // Create editor modal
      const editorHTML = `
<div id="kali-editor-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;padding:20px;">
<div style="background:#1e1e1e;border:2px solid #333;border-radius:6px;width:90%;max-width:900px;max-height:90vh;margin:auto;display:flex;flex-direction:column;">
<div style="background:#262626;padding:8px 12px;border-bottom:1px solid #444;font-family:monospace;font-size:12px;color:#fff;">
GNU nano 7.2 \`${filename}\`
</div>
<textarea id="kali-editor-textarea" style="flex:1;background:#000;color:#0f0;font-family:'Courier New',monospace;font-size:14px;padding:12px;border:none;outline:none;resize:none;width:100%;box-sizing:border-box;">${node.content || ''}</textarea>
<div style="background:#262626;padding:8px 12px;border-top:1px solid #444;font-size:11px;color:#999;">
^O Write Out  ^X Exit    ^W Where Is  ^K Cut Text  ^U Uncut Text
</div>
</div>
</div>`;
      
      document.body.insertAdjacentHTML('beforeend', editorHTML);
      const textarea = document.getElementById('kali-editor-textarea');
      textarea.focus();
      textarea.setSelectionRange(0, 0);
      
      // Keyboard shortcuts
      const handleKey = (e) => {
        if (!this.active) return;
        
        if (e.ctrlKey && e.key === 'o') {
          e.preventDefault();
          this.save();
        } else if (e.ctrlKey && e.key === 'x') {
          e.preventDefault();
          this.exit();
        }
      };
      
      textarea.addEventListener('keydown', handleKey);
      
      // Exit button
      const overlay = document.getElementById('kali-editor-overlay');
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.exit();
        }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.exit();
        }
      });
    },
    
    save() {
      const textarea = document.getElementById('kali-editor-textarea');
      if (!textarea) return;
      
      this.node.content = textarea.value;
      this.interpreter.save();
      
      document.querySelector('.kali-editor-saved-msg')?.remove();
      const msg = document.createElement('div');
      msg.className = 'kali-editor-saved-msg';
      msg.textContent = 'File written';
      msg.style.cssText = 'position:absolute;top:10px;right:10px;background:#0f0;color:#000;padding:4px 8px;border-radius:4px;font-size:12px;z-index:10001;';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    },
    
    exit() {
      const overlay = document.getElementById('kali-editor-overlay');
      if (overlay) overlay.remove();
      this.active = false;
      this.term.write(window.kali_interpreter.getPrompt());
    }
  };

  console.info('[Kali] Editor module loaded');
})();
