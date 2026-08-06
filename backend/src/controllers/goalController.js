const Goal = require('../models/Goal');

// Controller for fetching all goals
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
};

// Controller for creating a new goal
const createGoal = async (req, res) => {
  const { title, description, stakeAmount, deadline, status } = req.body;

  // Validate required fields manually
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (typeof stakeAmount !== 'number' || !Number.isFinite(stakeAmount) || stakeAmount <= 0) {
    return res.status(400).json({ error: 'stakeAmount must be a positive number.' });
  }

  if (!deadline || typeof deadline !== 'string' || deadline.trim() === '') {
    return res.status(400).json({ error: 'Deadline is required.' });
  }

  try {
    const newGoal = await Goal.create({
      title: title.trim(),
      description: description.trim(),
      stakeAmount,
      deadline: deadline.trim(),
      status: status && typeof status === 'string' && status.trim() !== '' ? status.trim() : 'active'
    });

    return res.status(201).json(newGoal);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create goal.' });
  }
};

module.exports = {
  getGoals,
  createGoal
};
