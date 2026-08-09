const mongoose = require('mongoose');
const Challenge = require('../models/Challenge');
const { readChallenges, saveChallengeLocally } = require('../utils/localChallengeStore');

const getChallenges = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      return res.json(localChallenges);
    }

    let challenges = await Challenge.find().sort({ createdAt: -1 });
    const now = new Date();
    
    // Automatically fail expired active challenges
    challenges = await Promise.all(challenges.map(async (c) => {
      if (c.status === 'active' && new Date(c.deadline) < now) {
        c.status = 'failed';
        await c.save();
      }
      return c;
    }));

    res.json(challenges);
  } catch (error) {
    console.error('Failed to fetch challenges from MongoDB, serving local store:', error.message);
    const localChallenges = readChallenges();
    res.json(localChallenges);
  }
};

const getChallengeById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const localChallenges = readChallenges();
      const match = localChallenges.find(c => c._id === req.params.id || c.id === req.params.id);
      if (!match) return res.status(404).json({ error: 'Challenge not found.' });
      return res.json(match);
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    // Automatically fail if expired and active
    if (challenge.status === 'active' && new Date(challenge.deadline) < new Date()) {
      challenge.status = 'failed';
      await challenge.save();
    }

    res.json(challenge);
  } catch (error) {
    console.error('Failed to fetch challenge by id:', error.message);
    const localChallenges = readChallenges();
    const match = localChallenges.find(c => c._id === req.params.id || c.id === req.params.id);
    if (match) return res.json(match);
    res.status(500).json({ error: 'Failed to fetch challenge.' });
  }
};

const createChallenge = async (req, res) => {
  const { title, description, stakeAmount, deadline, status, integrationId, integrationHandle, metricValue } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (typeof stakeAmount !== 'number' || !Number.isFinite(stakeAmount) || stakeAmount <= 0) {
    return res.status(400).json({ error: 'stakeAmount must be a positive number.' });
  }

  if (!deadline) {
    return res.status(400).json({ error: 'Deadline is required.' });
  }

  const challengeData = {
    title: title.trim(),
    description: description.trim(),
    stakeAmount,
    deadline: new Date(deadline),
    status: status && typeof status === 'string' && status.trim() !== '' ? status.trim() : 'active',
    integrationId: integrationId || 'none',
    integrationHandle: integrationHandle || '',
    metricValue: metricValue || null
  };

  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB disconnected. Saving challenge locally.');
      const local = saveChallengeLocally(challengeData);
      return res.status(201).json(local);
    }

    const newChallenge = await Challenge.create(challengeData);
    return res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Failed to create challenge in DB, saving locally:', error.message);
    const local = saveChallengeLocally(challengeData);
    return res.status(201).json(local);
  }
};

const updateChallengeStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'proof_submitted', 'verifying', 'completed', 'failed', 'expired'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ id: req.params.id, status, updatedAt: new Date().toISOString() });
    }

    const update = { status };
    if (status === 'completed') {
      update.completedAt = new Date();
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update challenge.' });
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallengeStatus
};
