const express = require('express');
const cors = require('cors');
const homeRoutes = require('./routes/homeRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const proofRoutes = require('./routes/proofRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Create the Express application
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Enable JSON request body parsing
app.use(express.json());

// Mount route modules
app.use('/', homeRoutes);
app.use('/', challengeRoutes);
app.use('/', proofRoutes);
app.use('/', statsRoutes);

// Centralized error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
