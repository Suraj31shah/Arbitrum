const express = require('express');
const { getHome } = require('../controllers/homeController');

const router = express.Router();

// Define the home route
router.get('/', getHome);

module.exports = router;
