// scripts/list-users.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../models/_db');

// Respeta tu modelo existente:
let User;
try {
  User = require('../models/User'); // Debe existir y exportar el modelo
} catch (e) {
  console.error('❌ No se pudo cargar models/User.js:', e.message);
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    // pequeña espera opcional para garantizar conexión
    await new Promise(r => setTimeout(r, 300));

    // Excluye password si existe; ajusta los campos a mostrar si quieres
    const rows = await User.find({}, { password: 0 }).limit(500).lean();

    console.log(`\n👥 Usuarios encontrados: ${rows.length}\n`);
    rows.forEach(u => {
      const id = u._id;
      const role = u.role || u.rol || 'user';
      const email = u.email || u.phone || u.telefono || '(sin email)';
      const name = u.name || u.fullName || u.nombre || '';
      const created = u.createdAt || u.created_at || u.fechaAlta || '';
      console.log(`- ${id} | ${role} | ${email} | ${name} | ${created}`);
    });

    console.log('\n💡 Tip: Puedes filtrar dentro del script por role, fecha, etc.\n');
  } catch (err) {
    console.error('❌ Error list-users:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
