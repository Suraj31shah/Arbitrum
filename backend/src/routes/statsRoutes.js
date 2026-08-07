const express = require('express');
const { getDashboardStats } = require('../controllers/statsController');

const router = express.Router();

router.get('/api/stats', getDashboardStats);

module.exports = router;
