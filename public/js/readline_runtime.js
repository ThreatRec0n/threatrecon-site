// readline_runtime.js - Input runtime for Kali emulator
(function() {
  'use strict';

  function createReadlineRuntime({ term, dispatcher, getPrompt }) {
    let buffer = '';
    let cursor = 0;
    let history = [];
    let histIndex = -1;
    let tabCompletions = null;

    function handleKey(key, ctrl, shift, alt) {
      if (key === 'Enter') {
        const line = buffer;
        history.unshift(line);
        if (history.length > 100) history.pop();
        histIndex = -1;
        const savedBuffer = buffer;
        buffer = '';
        cursor = 0;
        return { type: 'submit', line: savedBuffer };
      }
      
      if (key === 'Backspace') {
        if (cursor > 0) {
          buffer = buffer.slice(0, cursor - 1) + buffer.slice(cursor);
          cursor--;
          return { type: 'backspace' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'Delete' || (key === 'd' && ctrl)) {
        if (cursor < buffer.length) {
          buffer = buffer.slice(0, cursor) + buffer.slice(cursor + 1);
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowLeft') {
        if (cursor > 0) {
          cursor--;
          term.write('\x1b[D');
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowRight') {
        if (cursor < buffer.length) {
          cursor++;
          term.write('\x1b[C');
        }
        return { type: 'noop' };
      }
      
      if (key === 'Home' || (key === 'a' && ctrl)) {
        const moveLeft = cursor;
        cursor = 0;
        if (moveLeft > 0) {
          term.write('\x1b[' + moveLeft + 'D');
        }
        return { type: 'noop' };
      }
      
      if (key === 'End' || (key === 'e' && ctrl)) {
        const moveRight = buffer.length - cursor;
        cursor = buffer.length;
        if (moveRight > 0) {
          term.write('\x1b[' + moveRight + 'C');
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowUp') {
        if (histIndex < history.length - 1) {
          histIndex++;
          buffer = history[histIndex];
          cursor = buffer.length;
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'ArrowDown') {
        if (histIndex > 0) {
          histIndex--;
          buffer = history[histIndex];
          cursor = buffer.length;
          return { type: 'render' };
        } else if (histIndex === 0) {
          histIndex = -1;
          buffer = '';
          cursor = 0;
          return { type: 'render' };
        }
        return { type: 'noop' };
      }
      
      if (key === 'Tab') {
        return { type: 'complete' };
      }
      
      // Printable characters
      if (key.length === 1 && key >= ' ') {
        buffer = buffer.slice(0, cursor) + key + buffer.slice(cursor);
        cursor++;
        term.write(key);
        return { type: 'noop' };
      }
      
      return { type: 'noop' };
    }

    function renderLine(promptText) {
      term.write('\r');
      term.write('\x1b[K');
      term.write(promptText);
      term.write(buffer);
      
      if (cursor < buffer.length) {
        const moveBack = buffer.length - cursor;
        if (moveBack > 0) {
          term.write('\x1b[' + moveBack + 'D');
        }
      }
    }

    async function submitCommand(line) {
      if (!dispatcher) return;

      // Execute command
      const ctx = {
        session: { user: 'kali', isRoot: false, cwd: term.buffer.active.cursorX },
        readline: { getHistoryFormatted: () => history },
        term,
        fs: window.kernelFS,
        proc: window.kernelProc
      };

      const result = await dispatcher.run(line, ctx);

      if (result.type === 'control') {
        if (result.action === 'clear') {
          term.write('\x1b[2J\x1b[H');
        } else if (result.action === 'endSession') {
          term.writeln('\x1b[33mMatch has ended\x1b[0m');
          return;
        }
      } else if (result.out && result.out.length > 0) {
        result.out.forEach(line => term.writeln(line));
      }

      return result;
    }

    return {
      handleKey,
      renderLine,
      submitCommand,
      getBuffer: () => ({ buf: buffer, pos: cursor }),
      setBuffer: (newBuf) => { buffer = newBuf; cursor = newBuf.length; }
    };
  }

  window.createReadlineRuntime = createReadlineRuntime;
  console.info('[ReadlineRuntime] Module loaded');
})();

