// tools/ws-send-location.js
// Uso: node tools/ws-send-location.js http://localhost:5000 <WALKER_ID> <LAT> <LNG>
const { io } = require('socket.io-client');

const url = process.argv[2] || 'http://localhost:5000';
const walkerId = process.argv[3] || 'demo-walker';
const lat = parseFloat(process.argv[4] || '19.4326');
const lng = parseFloat(process.argv[5] || '-99.1332');

const socket = io(url, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 2,
  timeout: 8000
});

socket.on('connect', () => {
  console.log('🔌 Conectado como', socket.id);
  const point = { lat, lng, at: new Date().toISOString() };
  console.log('↗️  Enviando location:update', { walkerId, point });
  socket.emit('location:update', { walkerId, point });
  setTimeout(() => process.exit(0), 500);
});

socket.on('connect_error', (e) => {
  console.error('⚠️  connect_error', e.message);
  process.exit(1);
});
