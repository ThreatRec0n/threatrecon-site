// ThreatRecon Labs - Main client logic
// Uses window globals for xterm.js and socket.io

(function() {
  'use strict';
  
  // Socket configuration
  const socketOpts = { transports: ['polling', 'websocket'], timeout: 5000 };
  let socket = null;
  let session = null;
  let term = null;
  let fitAddon = null;
  let inputBuffer = '';
  let history = [];
  let historyIndex = -1;
  let promptCached = '';
  let sessionTimeout = null;

  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    console.info('[Client] DOM ready, initializing...');
    
    // Button handlers (NO inline onclick)
    const btnAttack = document.getElementById('btn-attack');
    const btnDefend = document.getElementById('btn-defend');
    const btnClear = document.getElementById('btn-clear');
    const btnClearLog = document.getElementById('btn-clear-log');
    const btnPlayAgain = document.getElementById('btn-playagain');
    const btnEndSim = document.getElementById('endSimulation');
    
    if (btnAttack) btnAttack.addEventListener('click', () => startRole('attacker'));
    if (btnDefend) btnDefend.addEventListener('click', () => startRole('defender'));
    if (btnClear) btnClear.addEventListener('click', () => { if (term) term.clear(); });
    if (btnClearLog) btnClearLog.addEventListener('click', clearLog);
    if (btnPlayAgain) btnPlayAgain.addEventListener('click', resetSession);
    if (btnEndSim) btnEndSim.addEventListener('click', resetSession);
    
    // Window resize handler
    window.addEventListener('resize', () => {
      if (fitAddon) fitAddon.fit();
    });
    
    console.info('[Client] Event listeners attached');
  });

  // Start role selection
  function startRole(role) {
    console.info('[Client] startRole called:', role);
    
    // Hide role selection, show dashboard
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('endSimulation').classList.remove('hidden');
    
    showStatus('Connecting...');
    pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Selected role: ${role}` });
    
    // Create or use existing socket
    if (!socket) {
      console.info('[Client] Creating socket connection...');
      socket = io(window.location.origin, socketOpts);
      
      socket.on('connect', () => {
        console.info('[Client] Socket connected:', socket.id);
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Connected to server', type: 'success' });
        socket.emit('initSession', { role });
      });
      
      socket.on('connect_error', (err) => {
        console.error('[Client] Socket connect error:', err.message);
        showStatus('Connection failed');
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Connection error: ${err.message}`, type: 'error' });
      });
      
      socket.on('disconnect', () => {
        console.warn('[Client] Socket disconnected');
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Disconnected from server', type: 'error' });
      });
      
    } else if (socket.connected) {
      socket.emit('initSession', { role });
    } else {
      socket.connect();
    }
    
    // Set timeout: if no sessionCreated in 10s, show error
    sessionTimeout = setTimeout(() => {
      if (!session) {
        console.error('[Client] Timeout: no sessionCreated received');
        showStatus('Connection timeout');
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Connection timeout - please refresh', type: 'error' });
      }
    }, 10000);
  }

  // Socket event handlers
  if (typeof io !== 'undefined') {
    // Socket.IO is loaded via CDN
    socket = io(window.location.origin, socketOpts);
    
    socket.on('sessionCreated', (data) => {
      console.info('[Client] sessionCreated received:', data);
      if (sessionTimeout) clearTimeout(sessionTimeout);
      
      session = data;
      initTerminal(data);
      showStatus(`Connected as ${data.role}`);
      writePrompt();
    });
    
    socket.on('output', (payload) => {
      if (!term) return;
      
      if (payload.text) {
        term.write(payload.text.replace(/\n/g, '\r\n'));
      }
      
      if (payload.appendTimeline) {
        pushTimeline(payload.appendTimeline);
      }
      
      if (!session.ended && payload.showPrompt !== false) {
        if (payload.text && payload.text.endsWith('\n')) {
          term.write('\r\n');
          writePrompt();
        }
      }
    });
    
    socket.on('promptUpdate', (patch) => {
      console.info('[Client] promptUpdate received:', patch);
      if (!session) return;
      session = Object.assign(session, patch);
      term.write('\r\n');
      writePrompt();
    });
    
    socket.on('matchEnded', ({ aar, outcome }) => {
      console.info('[Client] matchEnded received:', outcome);
      if (!session) return;
      session.ended = true;
      showAAR(aar, outcome);
      document.getElementById('btn-playagain').classList.remove('hidden');
    });
    
    socket.on('errorEvent', (err) => {
      console.error('[Client] Server error:', err);
      showStatus(`Error: ${err.msg}`);
      pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Error: ${err.msg}`, type: 'error' });
    });
    
    socket.on('connect', () => {
      console.info('[Client] Socket connected:', socket.id);
      pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Connected to server', type: 'success' });
    });
  }

  // Initialize terminal
  function initTerminal(data) {
    if (term) return; // Already initialized
    
    console.info('[Client] Initializing terminal...');
    
    const termEl = document.getElementById('terminal');
    if (!termEl) {
      console.error('[Client] Terminal element not found');
      return;
    }
    
    try {
      term = new window.Terminal({
        rows: 24,
        cols: 100,
        cursorBlink: true,
        fontFamily: '"Fira Mono", "Source Code Pro", Menlo, monospace',
        theme: {
          background: '#000000',
          foreground: '#cbd5e1',
          cursor: '#94a3b8'
        }
      });
      
      fitAddon = new window.FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      term.open(termEl);
      fitAddon.fit();
      
      // Terminal input handling
      term.onKey(e => {
        if (session?.ended) return;
        
        const ev = e.domEvent;
        
        if (ev.key === 'Enter') {
          term.write('\r\n');
          const cmd = inputBuffer.trim();
          submitCommand(cmd);
          if (cmd) {
            history.unshift(cmd);
            historyIndex = -1;
          }
          inputBuffer = '';
        } else if (ev.key === 'Backspace') {
          if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
            term.write('\b \b');
          }
        } else if (ev.key === 'ArrowUp') {
          if (history.length > 0) {
            historyIndex = Math.min(historyIndex + 1, history.length - 1);
            clearInputBuffer();
            inputBuffer = history[historyIndex] || '';
            term.write(inputBuffer);
          }
        } else if (ev.key === 'ArrowDown') {
          if (historyIndex > 0) {
            historyIndex--;
            clearInputBuffer();
            inputBuffer = history[historyIndex] || '';
            term.write(inputBuffer);
          } else {
            clearInputBuffer();
            inputBuffer = '';
          }
        } else if (e.key.length === 1) {
          inputBuffer += e.key;
          term.write(e.key);
        }
      });
      
      term.writeln('\x1b[1;36m[ThreatRecon Labs]\x1b[0m');
      term.writeln(`Connected as \x1b[1;${data.role === 'attacker' ? '31' : '34'}m${data.role}\x1b[0m`);
      term.writeln('');
      
    } catch (err) {
      console.error('[Client] Terminal init error:', err);
    }
  }

  function clearInputBuffer() {
    for (let i = 0; i < inputBuffer.length; i++) {
      term.write('\b \b');
    }
  }

  function writePrompt() {
    if (!session || !term) return;
    
    const symbol = session.isRoot ? '#' : '$';
    const usr = session.user || 'user';
    const host = session.host || 'host';
    const cwd = session.cwd || '~';
    promptCached = `${usr}@${host}:${cwd}${symbol} `;
    term.write(`\x1b[1;32m${promptCached}\x1b[0m`);
  }

  function submitCommand(cmd) {
    if (!cmd) {
      writePrompt();
      return;
    }
    
    if (!socket || !socket.connected) {
      term.write('\r\n\x1b[1;31m[disconnected]\x1b[0m\r\n');
      writePrompt();
      return;
    }
    
    console.info('[Client] Sending command:', cmd);
    socket.emit('playerCommand', { cmd });
  }

  function showStatus(text) {
    const el = document.getElementById('statusIndicator');
    if (el) el.innerHTML = `<span class="pulse-dot"></span> ${text}`;
  }

  function pushTimeline(ev) {
    const el = document.getElementById('timeline');
    if (!el) return;
    
    const type = ev.type || 'info';
    const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-gray-300';
    const html = `<div class="${color}">[${ev.time}] ${ev.msg || ''}</div>`;
    
    // Remove "No events yet" placeholder
    const placeholder = el.querySelector('.text-gray-500');
    if (placeholder) placeholder.remove();
    
    el.insertAdjacentHTML('afterbegin', html);
  }

  function showAAR(aar, outcome) {
    if (!aar) return;
    
    const el = document.getElementById('aar');
    if (!el) return;
    
    const lines = [];
    lines.push(`\x1b[1;33m-- MATCH ENDED --\x1b[0m`);
    lines.push(`Outcome: ${outcome}`);
    lines.push(`Duration: ${aar.duration} minutes`);
    lines.push('');
    lines.push('Key Events:');
    if (aar.timeline && Array.isArray(aar.timeline)) {
      aar.timeline.slice(0, 10).forEach(t => lines.push(`- ${t.time} — ${t.summary || ''}`));
    }
    lines.push('');
    if (aar.recommendations && Array.isArray(aar.recommendations)) {
      lines.push('Recommendations:');
      aar.recommendations.forEach(r => lines.push(`- ${r}`));
    }
    
    term.write('\r\n\r\n' + lines.join('\r\n') + '\r\n\r\n');
    term.write('\x1b[2mPress F5 to restart or click "Play Again"\x1b[0m\r\n');
    
    el.hidden = false;
    el.textContent = lines.join('\n');
  }

  function clearLog() {
    const el = document.getElementById('timeline');
    if (el) el.innerHTML = '<div class="text-gray-500">No events yet...</div>';
  }

  function resetSession() {
    document.getElementById('roleSelection').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('endSimulation').classList.add('hidden');
    document.getElementById('aar').hidden = true;
    document.getElementById('btn-playagain').classList.add('hidden');
    clearLog();
    
    if (socket && socket.connected) {
      socket.disconnect();
    }
    socket = null;
    session = null;
    term = null;
    fitAddon = null;
    inputBuffer = '';
    history = [];
    historyIndex = -1;
    
    showStatus('Ready');
  }

  // Expose resetSession for UI
  window.resetSession = resetSession;
  
  console.info('[Client] labs.js loaded');
})();
