// middlewares/error.js
module.exports = (err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
};
