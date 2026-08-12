const express = require('express');
const {
  getChallenges,
  getChallengeById,
  createChallenge,
  joinChallenge,
  updateChallengeStatus,
  updateParticipantStatus
} = require('../controllers/challengeController');

const router = express.Router();

router.get('/api/challenges', getChallenges);
router.post('/api/challenges', createChallenge);
router.get('/api/challenges/:id', getChallengeById);
router.post('/api/challenges/:id/join', joinChallenge);
router.patch('/api/challenges/:id', updateChallengeStatus);
router.patch('/api/challenges/:id/participant', updateParticipantStatus);

// Aliases for compatibility
router.get('/api/goals', getChallenges);
router.post('/api/goals', createChallenge);

module.exports = router;
