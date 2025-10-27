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
  term.open(terminalEl);
  fitAddon.fit();

  // UI
  document.getElementById('btn-attack').addEventListener('click', () => startSession('attacker'));
  document.getElementById('btn-defend').addEventListener('click', () => startSession('defender'));
  document.getElementById('btn-clear').addEventListener('click', () => term.clear());
  window.addEventListener('resize', () => fitAddon.fit());

  function writePrompt() {
    promptStr = `${session?.user || 'player'}@${session?.host || 'lab'}:${session?.cwd || '~'}${session?.isRoot ? '#' : '$'} `;
    term.write(`\x1b[1;32m${promptStr}\x1b[0m`);
  }

  function startSession(role) {
    if (connected) return;
    term.clear();
    term.writeln(`Starting session as ${role}...`);
    socket.emit('initSession', { role });
  }

  socket.on('connect', () => {
    console.log('socket connected');
  });

  socket.on('sessionCreated', (s) => {
    session = s;
    connected = true;
    document.getElementById('sessionState').textContent = `Connected — ${s.role}`;
    document.getElementById('objectiveTitle').textContent = s.objectiveTitle;
    document.getElementById('objectiveText').textContent = s.objectiveText;
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
