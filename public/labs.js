// public/labs.js
(() => {
  const { Terminal } = window;
  const { FitAddon } = window;
  const term = new Terminal({
    rows: 24,
    cols: 120,
    cursorBlink: true,
    fontFamily: '"Fira Mono", "Source Code Pro", Menlo, monospace',
    theme: {
      background: '#000000',
      foreground: '#cbd5e1',
      cursor: '#94a3b8',
    }
  });
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  const socket = io({ transports: ['polling', 'websocket'] });
  let session = null;
  let prompt = '$';
  let promptStr = '';
  let inputBuffer = '';
  let history = [];
  let historyIndex = -1;
  let connected = false;
  const terminalEl = document.getElementById('terminal');
  if (terminalEl) {
    term.open(terminalEl);
    fitAddon.fit();
  } else {
    console.warn('Terminal element not found at initialization');
  }

  // Global functions for UI
  window.selectRole = (role) => {
    console.info('[Client] selectRole called:', role);
    
    // Disable role selection buttons
    const attackerBtn = document.querySelector('[onclick*="attacker"]');
    const defenderBtn = document.querySelector('[onclick*="defender"]');
    if (attackerBtn) attackerBtn.style.pointerEvents = 'none';
    if (defenderBtn) defenderBtn.style.pointerEvents = 'none';
    
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('endSimulation').classList.remove('hidden');
    
    logToTimeline(`Selected role: ${role}`, 'info');
    startSession(role);
    
    // Client-side timeout: if no sessionCreated within 10s, show error
    const timeoutId = setTimeout(() => {
      if (!connected) {
        console.error('[Client] Timeout: sessionCreated not received within 10s');
        logToTimeline('Connection timeout - please try again', 'error');
        if (attackerBtn) attackerBtn.style.pointerEvents = 'auto';
        if (defenderBtn) defenderBtn.style.pointerEvents = 'auto';
      }
    }, 10000);
    
    // Clear timeout on success
    socket.once('sessionCreated', () => {
      clearTimeout(timeoutId);
      connected = true;
    });
  };

  window.resetSession = () => {
    document.getElementById('roleSelection').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('endSimulation').classList.add('hidden');
    document.getElementById('systemLog').innerHTML = '<div class="text-gray-500">No events yet...</div>';
    term.clear();
    if (socket.connected) socket.disconnect();
    connected = false;
    session = null;
  };

  window.clearLog = () => {
    document.getElementById('systemLog').innerHTML = '<div class="text-gray-500">No events yet...</div>';
  };

  window.logToTimeline = (message, type = 'info') => {
    const log = document.getElementById('systemLog');
    const timestamp = new Date().toLocaleTimeString();
    const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-gray-300';
    const html = `<div class="${color}">[${timestamp}] ${message}</div>`;
    log.innerHTML = html + log.innerHTML;
  };

  // UI
  document.getElementById('btn-clear').addEventListener('click', () => term.clear());
  window.addEventListener('resize', () => fitAddon.fit());

  function writePrompt() {
    promptStr = `${session?.user || 'player'}@${session?.host || 'lab'}:${session?.cwd || '~'}${session?.isRoot ? '#' : '$'} `;
    term.write(`\x1b[1;32m${promptStr}\x1b[0m`);
  }

  function startSession(role) {
    if (connected) {
      console.warn('[Client] Session already connected, ignoring startSession');
      return;
    }
    
    console.info('[Client] startSession called for role:', role);
    
    if (!term || !terminalEl) {
      console.error('[Client] Terminal not initialized');
      logToTimeline('Terminal error: please refresh page', 'error');
      return;
    }
    
    term.clear();
    term.writeln(`\x1b[1;36m[ThreatRecon Labs]\x1b[0m`);
    term.writeln(`Starting session as \x1b[1;${role === 'attacker' ? '31' : '34'}m${role}\x1b[0m...`);
    term.writeln('');
    
    logToTimeline(`Session starting...`, 'info');
    logToTimeline(`Role: ${role}`, 'info');
    
    // Ensure socket is connected before emitting
    if (!socket.connected) {
      console.info('[Client] Socket not connected, waiting for connect...');
      socket.once('connect', () => {
        console.info('[Client] Socket connected, emitting initSession');
        socket.emit('initSession', { role });
      });
      
      // Timeout if connect doesn't happen
      setTimeout(() => {
        if (!socket.connected) {
          console.error('[Client] Failed to connect socket');
          logToTimeline('Failed to connect to server', 'error');
        }
      }, 5000);
    } else {
      console.info('[Client] Socket already connected, emitting initSession');
      socket.emit('initSession', { role });
    }
  }

  socket.on('connect', () => {
    console.info('[Client] socket connected');
    logToTimeline('Connected to server', 'success');
  });
  
  socket.on('connect_error', (err) => {
    console.error('[Client] Socket connect error:', err.message);
    logToTimeline(`Connection error: ${err.message}`, 'error');
  });
  
  socket.on('disconnect', () => {
    console.warn('[Client] Socket disconnected');
    logToTimeline('Disconnected from server', 'error');
    connected = false;
  });
  
  socket.on('errorEvent', (data) => {
    console.error('[Client] Server error event:', data);
    logToTimeline(`Server error: ${data.msg || 'Unknown error'}`, 'error');
  });

  socket.on('sessionCreated', (s) => {
    session = s;
    connected = true;
    document.getElementById('sessionState').innerHTML = `<span class="pulse-dot"></span> Connected as ${s.role}`;
    logToTimeline(`Connected to ThreatRecon Labs server`, 'success');
    term.writeln('');
    writePrompt();
  });

  // Server can send raw ANSI bytes as a string
  socket.on('output', (data) => {
    // data: { text: ansiString, appendTimeline: {time,msg} }
    if (data.appendTimeline) {
      addTimelineEvent(data.appendTimeline);
    }
    term.write(data.text.replace(/\n/g, '\r\n'));
    // After output, if session exists and not ended, reprint prompt if last char is newline
    if (!session?.ended && data.showPrompt !== false) {
      // If server wants to update prompt (e.g., become root), server emits 'promptUpdate'
      if (!data.text.endsWith('\n')) return;
      writePrompt();
    }
  });

  socket.on('promptUpdate', (s) => {
    session = Object.assign(session || {}, s);
    // redraw prompt on new line
    term.write('\r\n');
    writePrompt();
  });

  socket.on('matchEnded', (payload) => {
    session.ended = true;
    term.write('\r\n\r\n\x1b[1;33m-- MATCH ENDED --\x1b[0m\r\n');
    document.getElementById('aar').hidden = false;
    document.getElementById('aar').innerText = formatAAR(payload.aar);
    document.getElementById('btn-playagain').style.display = 'inline-block';
  });

  function addTimelineEvent(ev) {
    const el = document.getElementById('timeline');
    const p = document.createElement('div');
    p.style.padding = '6px 8px';
    p.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
    p.innerHTML = `<div style="font-size:12px;color:#94a3b8">${ev.time}</div><div style="margin-top:4px">${ev.msg}</div>`;
    el.prepend(p); // newest on top
  }

  function formatAAR(aar) {
    // Create a readable block
    const lines = [];
    lines.push(`Outcome: ${aar.outcome}`);
    lines.push(`Duration: ${aar.duration}`);
    lines.push('');
    lines.push('Key Events:');
    aar.timeline.forEach(t => lines.push(`- ${t.time} — ${t.summary}`));
    lines.push('');
    lines.push('Recommendations:');
    aar.recommendations.forEach(r => lines.push(`- ${r}`));
    return lines.join('\n');
  }

  // Terminal input handling
  term.onKey(e => {
    const ev = e.domEvent;
    const key = e.key;
    if (session?.ended) return;

    if (ev.key === 'Enter') {
      term.write('\r\n');
      const cmd = inputBuffer.trim();
      history.unshift(cmd);
      historyIndex = -1;
      inputBuffer = '';
      if (cmd.length > 0) {
        logToTimeline(`Command: ${cmd}`, 'info');
        socket.emit('playerCommand', { cmd });
      } else {
        writePrompt();
      }
    } else if (ev.key === 'Backspace') {
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        term.write('\b \b');
      }
    } else if (ev.key === 'ArrowUp') {
      if (history.length > 0) {
        historyIndex = Math.min(history.length - 1, historyIndex + 1);
        // clear current
        for (let i=0;i<inputBuffer.length;i++) term.write('\b \b');
        inputBuffer = history[historyIndex] || '';
        term.write(inputBuffer);
      }
    } else if (ev.key === 'ArrowDown') {
      if (historyIndex > 0) {
        historyIndex--;
        for (let i=0;i<inputBuffer.length;i++) term.write('\b \b');
        inputBuffer = history[historyIndex] || '';
        term.write(inputBuffer);
      } else {
        // clear
        for (let i=0;i<inputBuffer.length;i++) term.write('\b \b');
        inputBuffer = '';
      }
    } else if (key.length === 1) {
      // printable
      inputBuffer += key;
      term.write(key);
    }
  });

  // keep the prompt accessible on click
  terminalEl.addEventListener('click', () => term.focus());
})();
