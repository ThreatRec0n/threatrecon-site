// ThreatRecon Labs - Main client logic
// Uses window globals for xterm.js and socket.io

(function() {
  'use strict';
  
  // Final intended production backend URL.
  // After deploying labs-backend to Render and setting the custom domain,
  // this should resolve publicly.
  const LABS_BACKEND_URL = 'https://labs-api.threatrecon.io';
  
  // For local testing, temporarily override in browser console:
  // const LABS_BACKEND_URL = 'http://localhost:8080';
  
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
  async function startRole(role) {
    console.info('[Client] startRole called:', role);
    
    // Hide role selection, show dashboard
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('endSimulation').classList.remove('hidden');
    
    showStatus('Connecting...');
    pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Selected role: ${role}` });
    
    // Resilient socket connector
    const candidates = [];
    
    // 1) Same-origin relative path
    candidates.push({ label: 'same-origin /socket.io', url: `${location.protocol}//${location.host}`, path: '/socket.io' });
    
    // 2) Same-origin /api path (serverless pattern)
    candidates.push({ label: 'same-origin /api/socket.io', url: `${location.protocol}//${location.host}`, path: '/api/socket.io' });
    
    // 3) Explicit backend URL if configured
    if (LABS_BACKEND_URL && LABS_BACKEND_URL !== 'https://labs-api.threatrecon.io') {
      candidates.push({ label: 'configured LABS_BACKEND_URL', url: LABS_BACKEND_URL.replace(/\/$/, ''), path: '/socket.io' });
    }
    
    // Try to connect to first available endpoint
    async function tryConnect() {
      for (const c of candidates) {
        console.info(`[Client] Trying backend: ${c.label}`);
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Trying ${c.label}` });
        
        try {
          const socket = io(c.url, {
            path: c.path,
            transports: ['polling'],
            timeout: 5000
          });
          
          const connected = await new Promise((resolve) => {
            let resolved = false;
            
            const cleanup = () => {
              socket.off('connect', onConnect);
              socket.off('connect_error', onConnectError);
            };
            
            const onConnect = () => {
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve({ ok: true, socket });
              }
            };
            
            const onConnectError = (err) => {
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve({ ok: false, err });
              }
            };
            
            socket.once('connect', onConnect);
            socket.once('connect_error', onConnectError);
            
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                cleanup();
                try { socket.close(); } catch(e) {}
                resolve({ ok: false, err: new Error('timeout') });
              }
            }, 6000);
          });
          
          if (connected.ok) {
            console.info(`[Client] Connected to ${c.label}`);
            pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Connected to ${c.label}`, type: 'success' });
            
            // Set up event handlers
            connected.socket.on('connect', () => {
              showStatus('Active');
              connected.socket.emit('initSession', { role });
            });
            
            connected.socket.on('connect_error', (err) => {
              console.error('[Client] connect_error', err);
              pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Connection error', type: 'error' });
              showStatus('Connection failed');
            });
            
            window.__TR_socket = connected.socket;
            return connected.socket;
          } else {
            console.warn(`[Client] Failed ${c.label}:`, connected.err?.message);
            pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Failed ${c.label}`, type: 'error' });
            try { connected.socket.close(); } catch(e) {}
          }
        } catch (e) {
          console.error(`[Client] Exception trying ${c.label}:`, e);
          pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Exception: ${c.label}`, type: 'error' });
        }
      }
      
      return null;
    }
    
    const socket = await tryConnect();
    
    if (!socket) {
      showStatus('Connection failed');
      pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'All connection attempts failed', type: 'error' });
      return;
    }
    
    socket.on('sessionCreated', data => {
      console.info('[Client] sessionCreated', data);
      window.__TR_session = data;
      
      if (!window.__TR_termInitialized) {
        initTerminal(data);
        window.__TR_termInitialized = true;
      }
      
      writePrompt();
      showStatus(`Connected as ${data.role}`);
    });
    
    socket.on('output', payload => {
      if (!term) return;
      
      if (payload.text) {
        term.write(payload.text.replace(/\n/g, '\r\n'));
      }
      
      if (payload.appendTimeline) {
        pushTimeline(payload.appendTimeline);
      }
      
      if (!window.__TR_session.ended && payload.showPrompt !== false) {
        if (payload.text && payload.text.endsWith('\n')) {
          term.write('\r\n');
          writePrompt();
        }
      }
    });
    
    socket.on('promptUpdate', patch => {
      console.info('[Client] promptUpdate', patch);
      if (!window.__TR_session) return;
      window.__TR_session = { ...window.__TR_session, ...patch };
      if (term) {
        term.write('\r\n');
        writePrompt();
      }
    });
    
    socket.on('matchEnded', ({ aar, outcome }) => {
      console.info('[Client] matchEnded', outcome);
      if (window.__TR_session) window.__TR_session.ended = true;
      showAAR(aar, outcome);
      showStatus('Simulation complete');
      document.getElementById('btn-playagain').classList.remove('hidden');
    });
    
    socket.on('errorEvent', (err) => {
      console.error('[Client] errorEvent', err);
      pushTimeline({ time: new Date().toLocaleTimeString(), msg: `Error: ${err.msg}`, type: 'error' });
      showStatus('Error');
    });
    
    // Save socket globally for submitCommand
    window.__TR_socket = socket;
    
    // Set timeout
    sessionTimeout = setTimeout(() => {
      if (!window.__TR_session) {
        console.error('[Client] Timeout: no sessionCreated received');
        showStatus('Connection timeout');
        pushTimeline({ time: new Date().toLocaleTimeString(), msg: 'Connection timeout - please refresh', type: 'error' });
      }
    }, 10000);
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
        const session = window.__TR_session;
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
    const session = window.__TR_session;
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
    
    const s = window.__TR_socket;
    if (!s || !s.connected) {
      if (term) {
        term.write('\r\n\x1b[1;31m[disconnected]\x1b[0m\r\n');
        writePrompt();
      }
      return;
    }
    
    console.info('[Client] Sending command:', cmd);
    s.emit('playerCommand', { cmd });
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
