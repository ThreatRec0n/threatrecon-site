// Quick socket.io connection test for labs-backend
const { io } = require('socket.io-client');

const BACKEND = process.env.BACKEND || 'http://localhost:8080';
console.log('[Test] Connecting to', BACKEND);

const socket = io(BACKEND, {
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('[Test] ✅ Connected:', socket.id);
  socket.emit('initSession', { role: 'attacker' });
});

socket.on('sessionCreated', (data) => {
  console.log('[Test] ✅ Session created:', data.id, data.role);
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('[Test] ❌ Connect error:', err.message);
  process.exit(1);
});

socket.on('errorEvent', (err) => {
  console.error('[Test] ❌ Error event:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('[Test] ❌ Timeout waiting for sessionCreated');
  socket.disconnect();
  process.exit(2);
}, 10000);

