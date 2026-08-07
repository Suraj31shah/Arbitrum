const Proof = require('../models/Proof');
const Challenge = require('../models/Challenge');
const { analyzeProof } = require('../services/aiService');

const createProof = async (req, res) => {
  const { challengeId, githubUrl, websiteUrl, description } = req.body;

  if (!challengeId || typeof challengeId !== 'string' || challengeId.trim() === '') {
    return res.status(400).json({ error: 'challengeId is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'A file upload is required.' });
  }

  try {
    // Verify challenge exists
    const challenge = await Challenge.findById(challengeId.trim());
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({ error: `Cannot submit proof for a challenge with status: ${challenge.status}` });
    }

    if (new Date(challenge.deadline) < new Date()) {
      challenge.status = 'failed';
      await challenge.save();
      return res.status(400).json({ error: 'The deadline for this challenge has passed.' });
    }

    // Mark as verifying while AI runs
    challenge.status = 'verifying';
    await challenge.save();

    const proofData = {
      challengeId: challengeId.trim(),
      githubUrl: githubUrl && typeof githubUrl === 'string' ? githubUrl.trim() : '',
      websiteUrl: websiteUrl && typeof websiteUrl === 'string' ? websiteUrl.trim() : '',
      description: description.trim(),
      status: 'pending',
      filePath: req.file.path.replace(/\\/g, '/')
    };

    // Run Gemini AI analysis
    const aiAnalysis = await analyzeProof(proofData);

    // Save proof with analysis
    const proof = await Proof.create({
      ...proofData,
      aiAnalysis
    });

    // Update challenge status to indicate AI has finished analyzing
    challenge.status = 'ai_verified';
    await challenge.save();

    return res.status(201).json(proof);
  } catch (error) {
    console.error('Proof creation failed:', error.message);
    return res.status(500).json({ error: 'Failed to create proof.', details: error.message });
  }
};

const getProofsByChallenge = async (req, res) => {
  try {
    const { challengeId } = req.query;
    if (!challengeId) {
      return res.status(400).json({ error: 'challengeId query parameter is required.' });
    }
    const proofs = await Proof.find({ challengeId }).sort({ createdAt: -1 });
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proofs.' });
  }
};

const getProofById = async (req, res) => {
  try {
    const proof = await Proof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found.' });
    }
    res.json(proof);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proof.' });
  }
};

module.exports = {
  createProof,
  getProofsByChallenge,
  getProofById
};
