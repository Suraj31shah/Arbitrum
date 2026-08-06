const express = require('express');
const cors = require('cors');

// Create the Express application
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Enable JSON request body parsing
app.use(express.json());

// Root route for a simple health check
app.get('/', (req, res) => {
  res.json({
    message: 'CredStreak Backend Running'
  });
});

// Export the app so server.js can start it
module.exports = app;
