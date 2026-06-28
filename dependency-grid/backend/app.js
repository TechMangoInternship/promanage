const express = require('express');
const cors = require('cors');
const dependencyRoutes = require('./routes/dependencyRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/dependencies', dependencyRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'dependency-grid' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
