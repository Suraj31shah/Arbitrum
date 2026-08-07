const Challenge = require('../models/Challenge');

const getChallenges = async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to fetch challenges.' });
  }
};

const getChallengeById = async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to fetch challenge.' });
  }
};

const createChallenge = async (req, res) => {
  const { title, description, stakeAmount, deadline, status } = req.body;

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

  try {
    const newChallenge = await Challenge.create({
      title: title.trim(),
      description: description.trim(),
      stakeAmount,
      deadline: new Date(deadline),
      status: status && typeof status === 'string' && status.trim() !== '' ? status.trim() : 'active'
    });

    return res.status(201).json(newChallenge);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create challenge.' });
  }
};

const updateChallengeStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['active', 'proof_submitted', 'verifying', 'completed', 'failed', 'expired'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
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
