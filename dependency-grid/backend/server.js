require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5005;

const startServer = async () => {
  // Bypassing MongoDB completely due to network restrictions.
  // Using file-based JSON persistence instead of in-memory arrays.

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Dependency Grid API running on http://127.0.0.1:${PORT}`);
    console.log(`Health check: http://127.0.0.1:${PORT}/api/health`);
  });
};

startServer();
