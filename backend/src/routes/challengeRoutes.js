const express = require('express');
const {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallengeStatus
} = require('../controllers/challengeController');

const router = express.Router();

router.get('/api/challenges', getChallenges);
router.post('/api/challenges', createChallenge);
router.get('/api/challenges/:id', getChallengeById);
router.patch('/api/challenges/:id', updateChallengeStatus);

// Aliases for compatibility
router.get('/api/goals', getChallenges);
router.post('/api/goals', createChallenge);

module.exports = router;
