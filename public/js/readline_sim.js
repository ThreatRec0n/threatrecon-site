// readline_sim.js - Real shell-like input editing with tab completion
(function() {
  'use strict';

  class ReadlineSim {
    constructor() {
      this.buffer = '';
      this.cursor = 0;
      this.history = [];
      this.historyIndex = -1;
      this.tempLine = '';
    }
    
    handleKey(key, ctrl, shift, alt, term) {
      // Handle special keys
      if (key === 'Enter') {
        const line = this.buffer;
        this.history.unshift(line);
        if (this.history.length > 100) this.history.pop();
        this.historyIndex = -1;
        this.buffer = '';
        this.cursor = 0;
        this.tempLine = '';
        return { type: 'submit', line };
      }
      
      if (key === 'Backspace') {
        if (this.cursor > 0) {
          this.buffer = this.buffer.slice(0, this.cursor - 1) + this.buffer.slice(this.cursor);
          this.cursor--;
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'Delete' || (key === 'd' && ctrl)) {
        if (this.cursor < this.buffer.length) {
          this.buffer = this.buffer.slice(0, this.cursor) + this.buffer.slice(this.cursor + 1);
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowLeft') {
        if (this.cursor > 0) {
          this.cursor--;
          term.write('\x1b[D');
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowRight') {
        if (this.cursor < this.buffer.length) {
          this.cursor++;
          term.write('\x1b[C');
        }
        return { type: 'noop' };
      }
      
      if (key === 'Home' || (key === 'a' && ctrl)) {
        const moveLeft = this.cursor;
        this.cursor = 0;
        if (moveLeft > 0) {
          term.write('\x1b[' + moveLeft + 'D');
        }
        return { type: 'noop' };
      }
      
      if (key === 'End' || (key === 'e' && ctrl)) {
        const moveRight = this.buffer.length - this.cursor;
        this.cursor = this.buffer.length;
        if (moveRight > 0) {
          term.write('\x1b[' + moveRight + 'C');
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowUp') {
        if (this.historyIndex < this.history.length - 1) {
          if (this.historyIndex === -1) {
            this.tempLine = this.buffer;
          }
          this.historyIndex++;
          this.buffer = this.history[this.historyIndex];
          this.cursor = this.buffer.length;
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowDown') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.buffer = this.history[this.historyIndex];
          this.cursor = this.buffer.length;
          return { type: 'render' };
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.buffer = this.tempLine;
          this.cursor = this.buffer.length;
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'Tab') {
        return { type: 'complete' };
      }
      
      // Printable characters
      if (key.length === 1 && key >= ' ') {
        this.buffer = this.buffer.slice(0, this.cursor) + key + this.buffer.slice(this.cursor);
        this.cursor++;
        // Don't print here - let caller handle it
        return { type: 'print', char: key };
      }
      
      return { type: 'noop' };
    }
    
    renderLine(term, promptText) {
      // Clear line and rewrite prompt + buffer
      term.write('\r');
      term.write('\x1b[K');
      term.write(promptText);
      term.write(this.buffer);
      
      // Position cursor
      if (this.cursor < this.buffer.length) {
        const moveBack = this.buffer.length - this.cursor;
        if (moveBack > 0) {
          term.write('\x1b[' + moveBack + 'D');
        }
      }
    }
    
    getLine() {
      return this.buffer;
    }
    
    setLine(line) {
      this.buffer = line;
      this.cursor = line.length;
    }
    
    complete(prefix, getCompletions) {
      const completions = getCompletions(prefix);
      if (!completions || completions.length === 0) return null;
      
      if (completions.length === 1) {
        return completions[0];
      }
      
      // Find longest common prefix
      let lcp = completions[0];
      for (let i = 1; i < completions.length; i++) {
        let j = 0;
        while (j < lcp.length && j < completions[i].length && lcp[j] === completions[i][j]) {
          j++;
        }
        lcp = lcp.slice(0, j);
      }
      
      return { lcp, completions };
    }
  }
  
  window.ReadlineSim = ReadlineSim;
  console.info('[Readline] Module loaded');
})();
