// ThreatRecon Labs - Main Game Client
// Handles UI interactions, terminal rendering, and WebSocket communication

let socket;
let matchId;
let playerRole;
let matchState = { status: 'waiting' };

// DOM Elements
const modeSelection = document.getElementById('modeSelection');
const gameInterface = document.getElementById('gameInterface');
const aarScreen = document.getElementById('aarScreen');
const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');
const executeBtn = document.getElementById('executeBtn');
const selectAttacker = document.getElementById('selectAttacker');
const selectDefender = document.getElementById('selectDefender');
const gameStatus = document.getElementById('gameStatus');
const aarTitle = document.getElementById('aarTitle');
const aarContent = document.getElementById('aarContent');
const playAgainBtn = document.getElementById('playAgainBtn');

// Connect WebSocket when role is selected
function connectSocket() {
  socket = io({
    transports: ['polling', 'websocket'], // Ensure polling works on Vercel
    upgrade: true,
    rememberUpgrade: true
  });
  
  socket.on('connect', () => {
    log('Connected to ThreatRecon Labs server', 'system');
  });
  
  socket.on('connect_error', (err) => {
    log(`Connection error: ${err.message}`, 'error');
  });
  
  socket.on('command_output', (data) => {
    if (data.output && data.output.trim()) {
      addOutput(data.output);
    }
  });
  
  socket.on('ai_event', (data) => {
    log(`[AI] ${data.message}`, 'ai');
  });
  
  socket.on('match_ended', (data) => {
    matchState = data;
    showAAR(data);
  });
  
  socket.on('timeline_update', (data) => {
    updateTimeline(data.timeline);
  });
  
  socket.on('disconnect', () => {
    log('Disconnected from server', 'system');
  });
}

// Mode selection handlers
selectAttacker.addEventListener('click', () => {
  startMatch('attacker');
});

selectDefender.addEventListener('click', () => {
  startMatch('defender');
});

// Start match
async function startMatch(role) {
  playerRole = role;
  
  try {
    const res = await fetch('/api/labs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    
    const data = await res.json();
    
    if (!res.ok || !data.matchId) {
      log(`Error: ${data.error || 'Failed to create match'}`, 'error');
      return;
    }
    
    matchId = data.matchId;
    
    // Connect to socket now
    connectSocket();
    
    modeSelection.classList.add('hidden');
    gameInterface.classList.remove('hidden');
    
    log(`Match started. You are playing as ${role.toUpperCase()}.`, 'system');
    log('Type "help" to see available commands.', 'system');
    
    // Join the match once connected
    socket.once('connect', () => {
      socket.emit('join_match', { matchId });
    });
    
  } catch (err) {
    log(`Error: ${err.message}`, 'error');
  }
}

// Terminal functions
function log(message, type = 'system') {
  const div = document.createElement('div');
  div.className = 'mb-1';
  
  switch (type) {
    case 'system':
      div.className += ' text-blue-400';
      break;
    case 'ai':
      div.className += ' text-yellow-400 italic';
      break;
    case 'error':
      div.className += ' text-red-400';
      break;
    case 'prompt':
      div.className += ' text-green-400';
      break;
    default:
      div.className += ' text-white';
  }
  
  div.textContent = message;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

function addOutput(output) {
  const lines = output.split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      log(line, 'output');
    }
  });
}

// Execute command
executeBtn.addEventListener('click', executeCommand);
commandInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') executeCommand();
});

function executeCommand() {
  const command = commandInput.value.trim();
  if (!command) return;
  
  log(`${getPrompt()} ${command}`, 'command');
  
  socket.emit('execute_command', {
    matchId,
    command,
    args: command.split(' ').slice(1),
  });
  
  commandInput.value = '';
}

function getPrompt() {
  if (playerRole === 'attacker') {
    return `attacker@kali:$`;
  } else {
    return `PS SOC:\\>`;
  }
}

// Update timeline
function updateTimeline(timeline) {
  const timelineDiv = document.getElementById('timeline');
  timelineDiv.innerHTML = '';
  
  const recent = timeline.slice(-10); // Last 10 events
  recent.forEach(event => {
    const div = document.createElement('div');
    div.className = 'text-xs text-gray-400 border-l-2 border-gray-700 pl-2';
    div.textContent = `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.message}`;
    timelineDiv.appendChild(div);
  });
}

// Show AAR
function showAAR(data) {
  gameInterface.classList.add('hidden');
  aarScreen.classList.remove('hidden');
  
  const winner = data.winner === 'player' ? 'Victory' : 'Defeated';
  aarTitle.textContent = winner;
  aarTitle.className = data.winner === 'player' ? 'glow-green' : 'glow-red';
  
  let html = `
    <div class="space-y-4">
      <p><strong>Role:</strong> ${data.aar.playerRole}</p>
      <p><strong>Duration:</strong> ${data.aar.duration} minutes</p>
      <p><strong>Outcome:</strong> ${data.aar.outcome}</p>
      
      <h3 class="font-semibold">Statistics:</h3>
      <ul class="list-disc list-inside text-sm text-gray-400">
        <li>Total Events: ${data.aar.statistics.totalEvents}</li>
        <li>Player Actions: ${data.aar.statistics.playerActions}</li>
        <li>AI Actions: ${data.aar.statistics.aiActions}</li>
      </ul>
      
      <h3 class="font-semibold">Key Findings:</h3>
      <ul class="list-disc list-inside text-sm text-gray-400">
        ${data.aar.keyFindings.map(f => `<li>${f}</li>`).join('')}
      </ul>
      
      <h3 class="font-semibold">Recommendations:</h3>
      <ul class="list-disc list-inside text-sm text-gray-400">
        ${data.aar.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  `;
  
  aarContent.innerHTML = html;
}

// Play again
playAgainBtn.addEventListener('click', () => {
  aarScreen.classList.add('hidden');
  modeSelection.classList.remove('hidden');
  terminal.innerHTML = '';
  matchState = { status: 'waiting' };
});

