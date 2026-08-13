const express = require('express');
const upload = require('../config/upload');
const { createProof, getProofsByChallenge, getProofById, getIntegrationPreview, disputeProof } = require('../controllers/proofController');

const router = express.Router();

// Fetch proofs by challenge or fetch single proof
router.get('/api/proofs', getProofsByChallenge);
router.get('/api/proofs/:id', getProofById);
router.post('/api/proofs/:id/dispute', express.json(), disputeProof);
router.get('/api/challenges/:id/integration-preview', getIntegrationPreview);

// Create proof with file upload
router.post('/api/proofs', (req, res, next) => {
  upload.array('files', 5)(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
}, createProof);

module.exports = router;
