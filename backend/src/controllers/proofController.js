const mongoose = require('mongoose');
const Proof = require('../models/Proof');
const Challenge = require('../models/Challenge');
const { analyzeProof } = require('../services/aiService');
const { saveProofLocally, readProofs } = require('../utils/localProofStore');
const { readChallenges } = require('../utils/localChallengeStore');
const { fetchIntegrationData } = require('../services/verificationService');

const createProof = async (req, res) => {
  const { challengeId, githubUrl, websiteUrl, description } = req.body;

  if (!challengeId || typeof challengeId !== 'string' || challengeId.trim() === '') {
    return res.status(400).json({ error: 'challengeId is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  try {
    const proofData = {
      challengeId: challengeId.trim(),
      githubUrl: githubUrl && typeof githubUrl === 'string' ? githubUrl.trim() : '',
      websiteUrl: websiteUrl && typeof websiteUrl === 'string' ? websiteUrl.trim() : '',
      description: description.trim(),
      status: 'pending',
      filePath: req.file ? req.file.path.replace(/\\/g, '/') : ''
    };

    // Run Gemini AI analysis
    // First, check if challenge has an integration
    let integrationData = null;
    const challenge = await Challenge.findById(challengeId.trim());

    if (challenge && challenge.integrationId && challenge.integrationId !== 'none') {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      integrationData = await fetchIntegrationData(challenge.integrationId, challenge.integrationHandle, start, end);
    }

    const aiAnalysis = await analyzeProof({ ...proofData, integrationData });

    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB disconnected. Saving proof locally.');
      const localProof = saveProofLocally({ ...proofData, integrationData, aiAnalysis });
      return res.status(201).json({ ...localProof, message: 'Proof saved locally (MongoDB offline).' });
    }

    // Verify challenge exists in DB
    if (challenge) {
      challenge.status = 'ai_verified';
      await challenge.save();
    }

    // Save proof with analysis
    const proof = await Proof.create({
      ...proofData,
      integrationData,
      aiAnalysis
    });

    return res.status(201).json(proof);
  } catch (error) {
    console.error('Proof creation failed:', error.message);
    const localProof = saveProofLocally({
      challengeId: challengeId?.trim() || 'local-challenge',
      description: description?.trim() || '',
      filePath: req.file?.path?.replace(/\\/g, '/') || '',
      aiAnalysis: { confidence: 0, completed: false, summary: error.message }
    });
    
    // Make sure we still update the challenge status so the UI shows the AI error instead of skipping it
    try {
      const existingChallenge = await Challenge.findById(challengeId?.trim());
      if (existingChallenge) {
        existingChallenge.status = 'ai_verified';
        await existingChallenge.save();
      }
    } catch (e) {
      // Ignore
    }

    return res.status(201).json({ ...localProof, message: 'Saved locally due to database error.' });
  }
};

const getProofsByChallenge = async (req, res) => {
  try {
    const { challengeId } = req.query;
    if (!challengeId) {
      return res.status(400).json({ error: 'challengeId query parameter is required.' });
    }
    if (mongoose.connection.readyState !== 1) {
      const localProofs = readProofs().filter(p => p.challengeId === challengeId || p.goalId === challengeId);
      return res.json(localProofs);
    }
    const proofs = await Proof.find({ challengeId }).sort({ createdAt: -1 });
    res.json(proofs);
  } catch (error) {
    const { challengeId } = req.query;
    const localProofs = readProofs().filter(p => p.challengeId === challengeId || p.goalId === challengeId);
    res.json(localProofs);
  }
};

const getProofById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const localProofs = readProofs();
      const match = localProofs.find(p => p._id === req.params.id || p.id === req.params.id);
      if (!match) return res.status(404).json({ error: 'Proof not found.' });
      return res.json(match);
    }

    const proof = await Proof.findById(req.params.id);
    if (!proof) {
      const localProofs = readProofs();
      const match = localProofs.find(p => p._id === req.params.id || p.id === req.params.id);
      if (match) return res.json(match);
      return res.status(404).json({ error: 'Proof not found.' });
    }
    res.json(proof);
  } catch (error) {
    const localProofs = readProofs();
    const match = localProofs.find(p => p._id === req.params.id || p.id === req.params.id);
    if (match) return res.json(match);
    res.status(500).json({ error: 'Failed to fetch proof.' });
  }
};

module.exports = {
  createProof,
  getProofsByChallenge,
  getProofById
};
