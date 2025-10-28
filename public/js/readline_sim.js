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
        return { type: 'submit', line };
      }
      
      if (key === 'Backspace') {
        if (this.cursor > 0) {
          this.buffer = this.buffer.slice(0, this.cursor - 1) + this.buffer.slice(this.cursor);
          this.cursor--;
          this.rerender(term);
        }
        return { type: 'noop' };
      }
      
      if (key === 'Delete' || (key === 'd' && ctrl)) {
        if (this.cursor < this.buffer.length) {
          this.buffer = this.buffer.slice(0, this.cursor) + this.buffer.slice(this.cursor + 1);
          this.rerender(term);
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowLeft') {
        if (this.cursor > 0) {
          this.cursor--;
          this.rerender(term);
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowRight') {
        if (this.cursor < this.buffer.length) {
          this.cursor++;
          this.rerender(term);
        }
        return { type: 'noop' };
      }
      
      if (key === 'Home' || (key === 'a' && ctrl)) {
        this.cursor = 0;
        this.rerender(term);
        return { type: 'noop' };
      }
      
      if (key === 'End' || (key === 'e' && ctrl)) {
        this.cursor = this.buffer.length;
        this.rerender(term);
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
          this.rerender(term);
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowDown') {
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.buffer = this.history[this.historyIndex];
          this.cursor = this.buffer.length;
          this.rerender(term);
        } else if (this.historyIndex === 0) {
          this.historyIndex = -1;
          this.buffer = this.tempLine;
          this.cursor = this.buffer.length;
          this.rerender(term);
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
        this.rerender(term);
        return { type: 'noop' };
      }
      
      return { type: 'noop' };
    }
    
    rerender(term) {
      // Clear current line and re-render with cursor positioning
      const currentCol = term.buffer.active.cursorX;
      const currentRow = term.buffer.active.cursorY;
      
      // Move to start of line
      term.write('\r');
      
      // Print the prompt (will be written by caller before calling readline)
      // Then print the buffer
      term.write(this.buffer);
      
      // Position cursor
      const targetCol = term.buffer.active.cursorX;
      const cursorCol = currentCol + this.cursor;
      
      // Calculate how many backspaces needed
      const bsCount = term.buffer.active.cursorX - cursorCol;
      if (bsCount > 0) {
        term.write('\r');
        const promptLen = term.buffer.active.cursorX;
        term.write(this.buffer);
        // Move cursor to correct position
        while (term.buffer.active.cursorX < promptLen + this.cursor) {
          term.write(' ');
        }
        term.write('\r');
        term.write(new Array(promptLen + this.cursor).fill(' ').join(''));
        term.write('\r');
        term.write(new Array(promptLen).fill(' ').join(''));
      } else {
        for (let i = 0; i < bsCount; i++) {
          term.write('\b');
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

