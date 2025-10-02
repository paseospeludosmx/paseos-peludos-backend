// models/_db.js
const mongoose = require('mongoose');

function connectDB() {
  const { MONGO_URI, MONGO_DB } = process.env;
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en .env');
    process.exit(1);
  }

  mongoose.set('strictQuery', true);

  const opts = {
    ...(MONGO_DB ? { dbName: MONGO_DB } : {}),
    serverSelectionTimeoutMS: 10000,
    retryWrites: true
  };

  return mongoose
    .connect(MONGO_URI, opts)
    .then(() => console.log('✅ [list-users] Conectado a MongoDB'))
    .catch(err => {
      console.error('❌ [list-users] Error MongoDB:', err.message);
      process.exit(1);
    });
}

module.exports = { connectDB };
