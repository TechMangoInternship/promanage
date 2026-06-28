const express = require('express');
const cors = require('cors');
const featureRoutes = require('./routes/featureRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/features', featureRoutes);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'features-grid' });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
