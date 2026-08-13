const mongoose = require('mongoose');
const Proof = require('../models/Proof');
const Challenge = require('../models/Challenge');
const { analyzeProof } = require('../services/aiService');
const { saveProofLocally, readProofs } = require('../utils/localProofStore');
const { fetchIntegrationData } = require('../services/verificationService');
const { resolveOnChain } = require('../services/resolveService');

const createProof = async (req, res) => {
  if (!req.isAuthenticated() || !req.user || !req.user.walletAddress) {
    return res.status(401).json({ error: 'You must be logged in with a wallet to submit proof.' });
  }

  const { challengeId, githubUrl, websiteUrl, description } = req.body;
  const walletAddress = req.user.walletAddress;

  if (!challengeId || typeof challengeId !== 'string' || challengeId.trim() === '') {
    return res.status(400).json({ error: 'challengeId is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  try {
    const challenge = await Challenge.findById(challengeId.trim());
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    const participant = challenge.participants.find(
      p => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this challenge.' });
    }

    if (participant.status !== 'active' && participant.status !== 'proof_submitted') {
      return res.status(400).json({ error: `Cannot submit proof. Your status is ${participant.status}.` });
    }

    const proofData = {
      challengeId: challengeId.trim(),
      walletAddress: walletAddress.toLowerCase(),
      githubUrl: githubUrl && typeof githubUrl === 'string' ? githubUrl.trim() : '',
      websiteUrl: websiteUrl && typeof websiteUrl === 'string' ? websiteUrl.trim() : '',
      description: description.trim(),
      status: 'pending',
      filePath: req.file ? req.file.path.replace(/\\/g, '/') : ''
    };

    // First update status to show we're verifying
    participant.status = 'verifying';
    await challenge.save();

    let integrationData = null;
    let isSuccess = false;
    let analysisNotes = '';

    if (challenge.integrationId && challenge.integrationId !== 'none') {
      const end = new Date();
      const start = new Date(challenge.startTime); // Since challenge start
      
      let participantHandle = '';
      if (challenge.integrationId === 'github') participantHandle = req.user.username;
      else if (challenge.integrationId === 'todoist') participantHandle = req.user.todoistId;
      else if (challenge.integrationId === 'notion') participantHandle = req.user.notionId;
      else if (challenge.integrationId === 'google') participantHandle = req.user.googleId;
      
      if (!participantHandle) {
        return res.status(400).json({ error: `Cannot verify proof: You have not linked your ${challenge.integrationId} account.` });
      }

      integrationData = await fetchIntegrationData(challenge.integrationId, participantHandle, start, end);
      
      // Deterministic check
      if (integrationData && typeof integrationData.value === 'number') {
        const target = challenge.metricValue || 0;
        if (integrationData.value >= target) {
          isSuccess = true;
          analysisNotes = `Integration verified: Achieved ${integrationData.value} / ${target}.`;
        } else {
          isSuccess = false;
          analysisNotes = `Integration failed: Achieved ${integrationData.value} / ${target}.`;
        }
      }
    } else {
      // Manual verification: we default to success if no AI is used, or we could leave it pending.
      // Since AI is removed from the flow, manual challenges succeed automatically for this hackathon demo.
      isSuccess = true;
      analysisNotes = "Manual proof accepted.";
    }

    // AI is sidelined per user request. We construct a fake aiAnalysis object to satisfy the schema/UI
    const aiAnalysis = {
      completed: isSuccess,
      summary: analysisNotes,
      strengths: integrationData ? [integrationData.text] : [],
      weaknesses: []
    };

    // Save proof with analysis
    const proof = await Proof.create({
      ...proofData,
      integrationData: integrationData ? integrationData.text : null,
      aiAnalysis
    });

    // Update participant with proof result
    if (isSuccess) {
      participant.status = 'completed';
      participant.completedAt = new Date();
    } else {
      // If failed verification, they can try again if there's still time
      participant.status = 'active'; 
    }
    
    participant.proofId = proof._id;

    // Check if challenge is fully resolved
    const allResolved = challenge.participants.every(
      p => p.status === 'completed' || p.status === 'failed'
    );
    if (allResolved && challenge.status === 'active') {
      const anyCompleted = challenge.participants.some(p => p.status === 'completed');
      challenge.status = anyCompleted ? 'completed' : 'failed';
      challenge.completedAt = new Date();

      // Trigger on-chain resolution
      if (!challenge.resolvedOnChain) {
        const winnersAddresses = challenge.participants
          .filter(p => p.status === 'completed')
          .map(p => p.walletAddress);
        resolveOnChain(challenge._id.toString(), winnersAddresses)
          .then(txHash => {
            if (txHash) {
              Challenge.findByIdAndUpdate(challenge._id, {
                resolvedOnChain: true,
                resolveTxHash: txHash
              }).catch(e => console.error('Failed to save resolve tx hash:', e.message));
            }
          })
          .catch(e => console.error('On-chain resolution failed:', e.message));
      }
    }

    await challenge.save();

    return res.status(201).json(proof);
  } catch (error) {
    console.error('Proof creation failed:', error.message);
    
    // Attempt to revert participant status to active if failed
    try {
      const existingChallenge = await Challenge.findById(challengeId?.trim());
      if (existingChallenge) {
        const p = existingChallenge.participants.find(p => p.walletAddress.toLowerCase() === req.user.walletAddress.toLowerCase());
        if (p) {
          p.status = 'active';
          await existingChallenge.save();
        }
      }
    } catch (e) {
      // Ignore
    }

    return res.status(500).json({ error: 'Failed to process proof: ' + error.message });
  }
};

const getProofsByChallenge = async (req, res) => {
  try {
    const { challengeId, walletAddress } = req.query;
    if (!challengeId) {
      return res.status(400).json({ error: 'challengeId query parameter is required.' });
    }
    
    let query = { challengeId };
    if (walletAddress) {
      query.walletAddress = walletAddress.toLowerCase();
    }
    
    if (mongoose.connection.readyState !== 1) {
      const localProofs = readProofs().filter(p => p.challengeId === challengeId);
      return res.json(walletAddress ? localProofs.filter(p => p.walletAddress === walletAddress.toLowerCase()) : localProofs);
    }
    const proofs = await Proof.find(query).sort({ createdAt: -1 });
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proofs' });
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
      return res.status(404).json({ error: 'Proof not found.' });
    }
    res.json(proof);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch proof.' });
  }
};

const getIntegrationPreview = async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;
  try {
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    if (!challenge.integrationId || challenge.integrationId === 'none') {
      return res.status(400).json({ error: 'This challenge does not use an app integration.' });
    }

    const end = new Date();
    const start = new Date(challenge.startTime);
    const integrationData = await fetchIntegrationData(challenge.integrationId, challenge.integrationHandle, start, end);

    return res.json(integrationData); // { text, value }
  } catch (error) {
    console.error('Integration preview failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch integration data.' });
  }
};

module.exports = {
  createProof,
  getProofsByChallenge,
  getProofById,
  getIntegrationPreview
};
