// tools/ws-subscribe.js
// Uso: node tools/ws-subscribe.js http://localhost:5000 <WALKER_ID>
const { io } = require('socket.io-client');

const url = process.argv[2] || 'http://localhost:5000';
const walkerId = process.argv[3] || 'demo-walker';

const socket = io(url, {
  transports: ['websocket', 'polling'], // no forzar solo websocket
  reconnectionAttempts: 5,
  timeout: 8000
});

socket.on('connect', () => {
  console.log('🔌 Conectado como', socket.id);
  socket.emit('subscribe:walker', { walkerId });
});

socket.on('subscribed', (msg) => console.log('✅ Subscribed', msg));
socket.on('location:update', (msg) => console.log('📍 Update', msg));

socket.on('connect_error', (e) => console.error('⚠️  connect_error', e.message));
socket.on('error', (e) => console.error('⚠️  error', e?.message || e));
socket.on('reconnect_error', (e) => console.error('⚠️  reconnect_error', e.message));
socket.on('disconnect', (reason) => console.log('❌ Desconectado', reason));
