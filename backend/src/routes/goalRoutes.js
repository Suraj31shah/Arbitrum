const express = require('express');
const { getGoals } = require('../controllers/goalController');

const router = express.Router();

// Route to fetch all goals
router.get('/api/goals', getGoals);

module.exports = router;
