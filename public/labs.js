// ThreatRecon Labs - Main client logic
// Uses window globals for xterm.js and socket.io

(function() {
  'use strict';
  
  // Default production backend URL for Socket.IO
  // This SHOULD match the custom domain you'll point at Render.
  let LABS_BACKEND_URL = 'https://labs-api.threatrecon.io';
  
  // Allows us to switch the backend target at runtime for testing.
  // Example from console:
  // window.overrideLabsBackend("http://localhost:8080")
  window.overrideLabsBackend = function(newUrl) {
    try {
      if (newUrl && typeof newUrl === "string") {
        LABS_BACKEND_URL = newUrl.replace(/\/$/, "");
        console.warn("[LabsClient] LABS_BACKEND_URL overridden ->", LABS_BACKEND_URL);
      }
    } catch (e) {
      console.error("overrideLabsBackend error:", e);
    }
  };
  
  let term = null;
  let fitAddon = null;
  let readline = null;
  let history = [];
  let historyIndex = -1;
  let promptCached = '';
  let sessionTimeout = null;
  let localSnapshot = null;
  let localCwd = '/home/kali';
  let pagerState = { active: false, content: [], page: 0 };
  let tabCompleteState = { activations: 0 };

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
      if (fitAddon && typeof fitAddon.fit === 'function') {
        fitAddon.fit();
      }
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
    
    // 1) If LABS_BACKEND_URL is defined, try that first.
    // This will typically be https://labs-api.threatrecon.io once DNS is live,
    // OR a Render URL, OR localhost via overrideLabsBackend().
    if (LABS_BACKEND_URL) {
      candidates.push({
        label: 'configured LABS_BACKEND_URL',
        url: LABS_BACKEND_URL,
        path: '/socket.io'
      });
    }
    
    // 2) same-origin /socket.io
    candidates.push({
      label: 'same-origin /socket.io',
      url: `${location.protocol}//${location.host}`,
      path: '/socket.io'
    });
    
    // 3) same-origin /api/socket.io
    candidates.push({
      label: 'same-origin /api/socket.io',
      url: `${location.protocol}//${location.host}`,
      path: '/api/socket.io'
    });
    
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
          
          // Log all events received
          socket.onAny((event, payload) => {
            console.log('[labsClient] onAny', event, payload);
          });
          
          const connected = await new Promise((resolve) => {
            let resolved = false;
            
            const cleanup = () => {
              socket.off('connect', onConnect);
              socket.off('connect_error', onConnectError);
            };
            
            const onConnect = () => {
              console.log('[labsClient] socket.id (client-side after connect):', socket.id, socket);
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
            
            // Set up event handlers - emit initSession immediately after connection
            console.log('[labsClient] socket connected, emitting initSession for role:', role);
            showStatus('Active');
            connected.socket.emit('initSession', { role });
            console.log('[labsClient] initSession emitted on socket.id:', connected.socket.id);
            
            // Listen for sessionCreated on this specific socket
            connected.socket.once('sessionCreated', async (data) => {
              console.log('[labsClient] sessionCreated received on socket.id', connected.socket.id, data);
              window.__TR_session = data;
              
              // Load local snapshot for file operations
              await loadSnapshot();
              
              if (!window.__TR_termInitialized) {
                initTerminal(data);
                window.__TR_termInitialized = true;
              }
              
              writePrompt();
              showStatus(`Connected as ${data.role}`);
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
    
    // Event handlers are already attached above in the connection success block
    // Just attach remaining handlers here if needed
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
      // Check if xterm.js is loaded
      if (!window.Terminal) {
        console.error('[Client] xterm.js not loaded');
        return;
      }
      
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
      
      // Check if FitAddon is loaded
      if (window.FitAddon && typeof window.FitAddon.FitAddon === 'function') {
        fitAddon = new window.FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.open(termEl);
        fitAddon.fit();
      } else {
        console.warn('[Client] FitAddon not available, opening terminal without fit');
        term.open(termEl);
      }
      
      // Initialize readline
      readline = new window.ReadlineSim();
      
      // Terminal input handling with readline
      term.onKey(async (e) => {
        const session = window.__TR_session;
        if (session?.ended) return;
        
        const ev = e.domEvent;
        
        // Handle pager mode
        if (pagerState.active) {
          if (ev.key === ' ') {
            pagerState.page++;
            term.write('\r\n');
            showPagerPage();
          } else if (ev.key === 'q' || ev.key === 'Q') {
            pagerState.active = false;
            term.write('\r\n');
            writePrompt();
          }
          ev.preventDefault();
          return;
        }
        
        const ctrl = ev.ctrlKey || ev.metaKey;
        const shift = ev.shiftKey;
        
        // Handle Tab completion
        if (ev.key === 'Tab') {
          ev.preventDefault();
          const currentLine = readline.getLine();
          const parts = currentLine.split(' ');
          const lastWord = parts[parts.length - 1];
          
          const completions = window.kali_interpreter && window.kali_interpreter.getCompletions
            ? window.kali_interpreter.getCompletions(lastWord)
            : [];
          
          if (completions.length > 0) {
            tabCompleteState.activations++;
            
            if (tabCompleteState.activations === 1) {
              // First tab: complete to longest common prefix
              const lcp = completions[0];
              for (let i = 1; i < completions.length; i++) {
                let j = 0;
                while (j < lcp.length && j < completions[i].length && lcp[j] === completions[i][j]) j++;
                const newLcp = lcp.slice(0, j);
                if (newLcp.length < j) break;
              }
              const prefixLen = parts[parts.length - 1].length;
              const completion = lcp.slice(prefixLen);
              readline.setLine(currentLine + completion);
              readline.rerender(term);
            } else if (tabCompleteState.activations >= 2) {
              // Second tab: list all completions
              term.writeln('');
              term.writeln(completions.join('  '));
              writePrompt();
              tabCompleteState.activations = 0;
            }
          } else {
            tabCompleteState.activations = 0;
          }
          return;
        }
        
        // Reset tab completion state on any non-tab key
        if (ev.key !== 'Tab') {
          tabCompleteState.activations = 0;
        }
        
        const result = readline.handleKey(ev.key, ctrl, shift, false, term);
        
        if (result.type === 'submit') {
          term.write('\r\n');
          await submitCommand(result.line);
          writePrompt();
        }
      });
      
      term.writeln('\x1b[1;36m[ThreatRecon Labs]\x1b[0m');
      term.writeln(`Connected as \x1b[1;${data.role === 'attacker' ? '31' : '34'}m${data.role}\x1b[0m`);
      term.writeln('');
      
    } catch (err) {
      console.error('[Client] Terminal init error:', err);
    }
  }

  function writePrompt() {
    const session = window.__TR_session;
    if (!session || !term) return;
    
    // Use Kali interpreter prompt if available, otherwise fallback
    let promptText;
    if (window.kali_interpreter && window.kali_interpreter.getPrompt) {
      promptText = window.kali_interpreter.getPrompt();
    } else {
      // Fallback prompt
      const isRoot = session.isRoot || session.asRoot;
      const user = isRoot ? 'root' : (session.user || 'kali');
      const host = localSnapshot?.meta?.distro || 'kali';
      const cwdRaw = session.cwd || localCwd || '/home/kali';
      const cwd = cwdRaw === '/home/kali' ? '~' : cwdRaw.replace('/home/kali', '~');
      
      const BOLD = '\x1b[1m';
      const GREEN = '\x1b[32m';
      const RED = '\x1b[31m';
      const CYAN = '\x1b[36m';
      const YELLOW = '\x1b[33m';
      const RESET = '\x1b[0m';
      const symbol = isRoot ? '#' : '$';
      promptText = `${BOLD}${RED}${user}${RESET}@${GREEN}${host}${RESET}:${CYAN}${cwd}${RESET}${YELLOW}${symbol}${RESET} `;
    }
    
    promptCached = promptText;
    term.write(promptText);
    
    // Initialize readline buffer after writing prompt
    if (readline) {
      readline.setLine('');
    }
  }

  // Load local snapshot and initialize Kali interpreter
  async function loadSnapshot() {
    if (localSnapshot && window.kali_interpreter.runtime) {
      return localSnapshot;
    }
    try {
      const response = await fetch('/kali_snapshot_full.json');
      localSnapshot = await response.json();
      console.info('[Client] Loaded local snapshot');
      
      // Initialize Kali interpreter
      if (window.kali_interpreter) {
        await window.kali_interpreter.init(localSnapshot);
        console.info('[Client] Kali interpreter initialized');
      }
      
      return localSnapshot;
    } catch (e) {
      console.error('[Client] Failed to load snapshot:', e);
      return null;
    }
  }

  // Pager functions for man pages
  function startPager(text) {
    const lines = text.split('\n');
    pagerState.active = true;
    pagerState.content = lines;
    pagerState.page = 0;
    showPagerPage();
  }
  
  function showPagerPage() {
    const pageSize = 18;
    const start = pagerState.page * pageSize;
    const slice = pagerState.content.slice(start, start + pageSize);
    slice.forEach(l => term.writeln(l));
    const more = (start + pageSize) < pagerState.content.length;
    if (more) {
      term.write('\n--More-- (press Space to continue, q to quit) ');
    } else {
      pagerState.active = false;
      writePrompt();
    }
  }
  
  // Filesystem helpers
  function fsNode(path, session = window.__TR_session) {
    const fs = localSnapshot && localSnapshot.fs;
    if (!fs) return null;
    
    if (!path) path = (session && session.cwd) || '/home/kali';
    
    // Handle relative paths
    if (!path.startsWith('/')) {
      let base = (session && session.cwd) || '/home/kali';
      if (base.endsWith('/')) base = base.slice(0, -1);
      path = base + '/' + path;
    }
    
    // Collapse dots (simple implementation)
    const parts = path.split('/').filter(Boolean);
    const stack = [];
    for (const p of parts) {
      if (p === '..') stack.pop();
      else if (p === '.') continue;
      else stack.push(p);
    }
    const norm = '/' + stack.join('/');
    
    // Direct special-case root
    if (norm === '/') return fs['/'];
    return fs[norm] || null;
  }

  function listDir(path) {
    const session = window.__TR_session;
    const node = fsNode(path, session);
    if (!node) return { err: 'No such file or directory' };
    if (node.type !== 'dir') return { err: 'Not a directory' };
    return { children: node.children || [] };
  }

  // Local command handlers
  function handleLocalCommand(rawCmd) {
    if (!localSnapshot) return false;
    
    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    const session = window.__TR_session;
    
    if (!cmd) { 
      writePrompt(); 
      return true; 
    }

    // man: use snapshot man pages
    if (cmd === 'man') {
      const target = args[0];
      if (!target) { 
        term.writeln('What manual page do you want?'); 
        writePrompt(); 
        return true; 
      }
      const manPath1 = `/usr/share/man_sim/${target}.1.txt`;
      const manPath2 = `/usr/share/man_sim/${target}.8.txt`;
      const node = localSnapshot.fs[manPath1] || localSnapshot.fs[manPath2];
      if (!node || !node.content) { 
        term.writeln(`No manual entry for ${target}`); 
        writePrompt(); 
        return true; 
      }
      startPager(node.content); 
      return true;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      const target = args[0] || (session && session.cwd) || '/home/kali';
      const res = listDir(target);
      if (res.err) { 
        term.writeln(`ls: ${res.err}`); 
        writePrompt(); 
        return true; 
      }
      const out = res.children.join('  ');
      term.writeln(out);
      writePrompt();
      return true;
    }

    if (cmd === 'pwd') { 
      term.writeln((session && session.cwd) || '/home/kali'); 
      writePrompt(); 
      return true; 
    }

    if (cmd === 'cd') {
      const target = args[0] || '/home/kali';
      const t = target.replace(/^~(?=$|\/)/, '/home/kali');
      const node = fsNode(t, session);
      if (!node) { 
        term.writeln(`bash: cd: ${target}: No such file or directory`); 
        writePrompt(); 
        return true; 
      }
      if (node.type !== 'dir') { 
        term.writeln(`bash: cd: ${target}: Not a directory`); 
        writePrompt(); 
        return true; 
      }
      if (session) session.cwd = t.endsWith('/') && t.length > 1 ? t.slice(0, -1) : t;
      localCwd = t.endsWith('/') && t.length > 1 ? t.slice(0, -1) : t;
      writePrompt();
      return true;
    }

    if (cmd === 'cat') {
      const target = args[0];
      if (!target) { 
        term.writeln('Usage: cat <file>'); 
        writePrompt(); 
        return true; 
      }
      const node = fsNode(target, session) || fsNode('/' + target, session);
      if (!node) { 
        term.writeln(`cat: ${target}: No such file or directory`); 
        writePrompt(); 
        return true; 
      }
      if (node.type === 'dir') { 
        term.writeln(`cat: ${target}: Is a directory`); 
        writePrompt(); 
        return true; 
      }
      term.writeln(node.content || '');
      writePrompt();
      return true;
    }

    if (cmd === 'whoami') { 
      const isRoot = (session && (session.isRoot || session.asRoot));
      term.writeln(isRoot ? 'root' : ((session && session.user) || 'kali')); 
      writePrompt(); 
      return true; 
    }

    if (cmd === 'id') {
      const isRoot = (session && (session.isRoot || session.asRoot));
      const u = isRoot ? {uid:0,gid:0} : {uid:1000,gid:1000};
      term.writeln(`uid=${u.uid}(${isRoot ? 'root' : 'kali'}) gid=${u.gid}(${isRoot ? 'root' : 'kali'}) groups=${u.gid}`);
      writePrompt(); 
      return true;
    }

    if (cmd === 'hostname') { 
      term.writeln((localSnapshot && localSnapshot.env && localSnapshot.env.HOSTNAME) || 'kali'); 
      writePrompt(); 
      return true; 
    }

    if (cmd === 'ifconfig' || cmd === 'ip') {
      term.writeln('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500');
      term.writeln('    inet 192.168.56.101  netmask 255.255.255.0  broadcast 192.168.56.255');
      term.writeln('    ether 02:42:ac:11:00:02');
      term.writeln('');
      writePrompt();
      return true;
    }

    return false;
  }

  async function submitCommand(cmd) {
    if (!cmd) {
      writePrompt();
      return;
    }
    
    // Add to history
    if (cmd.trim()) {
      history.unshift(cmd);
      if (history.length > 100) history = history.slice(0, 100);
      historyIndex = -1;
    }
    
    // Check for pager mode
    if (window.kali_pager && window.kali_pager.state && window.kali_pager.state.active) {
      if (cmd === ' ') {
        window.kali_pager.next();
        return;
      } else if (cmd.toLowerCase() === 'q') {
        window.kali_pager.quit();
        writePrompt();
        return;
      }
    }
    
    // Try Kali interpreter first
    if (window.kali_interpreter && window.kali_interpreter.runtime) {
      const handled = await window.kali_interpreter.handle(cmd, term);
      if (handled) {
        writePrompt();
        return;
      }
    }
    
    // Try legacy local command handler
    const handledLocally = handleLocalCommand(cmd);
    if (handledLocally) {
      writePrompt();
      return;
    }
    
    // Send to backend for intensive commands
    const s = window.__TR_socket;
    if (!s || !s.connected) {
      if (term) {
        term.write('\r\n\x1b[1;31m[disconnected]\x1b[0m\r\n');
        writePrompt();
      }
      return;
    }
    
    console.info('[Client] Sending command to backend:', cmd);
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
    
    if (window.__TR_socket && window.__TR_socket.connected) {
      window.__TR_socket.disconnect();
    }
    window.__TR_socket = null;
    window.__TR_session = null;
    term = null;
    fitAddon = null;
    inputBuffer = '';
    history = [];
    historyIndex = -1;
    localSnapshot = null;
    localCwd = '/home/kali';
    pagerState = { active: false, content: [], page: 0 };
    window.__TR_termInitialized = false;
    
    showStatus('Ready');
  }

  // Expose resetSession for UI
  window.resetSession = resetSession;
  
  console.info('[Client] labs.js loaded');
})();
