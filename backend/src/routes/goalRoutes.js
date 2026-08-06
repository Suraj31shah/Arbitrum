const express = require('express');
const { getGoals, createGoal } = require('../controllers/goalController');

const router = express.Router();

// Route to fetch all goals
router.get('/api/goals', getGoals);

// Route to create a new goal
router.post('/api/goals', createGoal);

module.exports = router;
