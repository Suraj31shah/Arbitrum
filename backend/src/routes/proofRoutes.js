const express = require('express');
const upload = require('../config/upload');
const { createProof } = require('../controllers/proofController');

const router = express.Router();

// Route to create a proof entry for a goal
router.post('/api/proofs', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
}, createProof);

module.exports = router;
