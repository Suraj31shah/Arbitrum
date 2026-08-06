const express = require('express');
const cors = require('cors');
const homeRoutes = require('./routes/homeRoutes');
const goalRoutes = require('./routes/goalRoutes');

// Create the Express application
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Enable JSON request body parsing
app.use(express.json());

// Use the home route module
app.use('/', homeRoutes);

// Use the goals route module
app.use('/', goalRoutes);

// Export the app so server.js can start it
module.exports = app;
