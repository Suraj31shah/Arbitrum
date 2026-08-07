const Proof = require('../models/Proof');
const { saveProofLocally } = require('../utils/localProofStore');
const connectDB = require('../config/database');
const { analyzeProof } = require('../services/aiService');

const createProof = async (req, res) => {
  const { goalId, githubUrl, websiteUrl, description, status } = req.body;

  if (!goalId || typeof goalId !== 'string' || goalId.trim() === '') {
    return res.status(400).json({ error: 'goalId is required.' });
  }

  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'A file upload is required.' });
  }

  try {
    const dbConnected = await connectDB();

    const proofData = {
      goalId: goalId.trim(),
      githubUrl: githubUrl && typeof githubUrl === 'string' ? githubUrl.trim() : '',
      websiteUrl: websiteUrl && typeof websiteUrl === 'string' ? websiteUrl.trim() : '',
      description: description.trim(),
      status: status && typeof status === 'string' && status.trim() !== '' ? status.trim() : 'pending',
      filePath: req.file.path.replace(/\\/g, '/')
    };

    const aiAnalysis = await analyzeProof(proofData);

    if (!dbConnected) {
      const proof = saveProofLocally({
        ...proofData,
        aiAnalysis
      });

      return res.status(201).json({
        ...proof,
        message: 'Proof saved locally because MongoDB is unavailable.'
      });
    }

    const proof = await Proof.create({
      ...proofData,
      aiAnalysis
    });

    return res.status(201).json(proof);
  } catch (error) {
    console.error('Proof creation failed:', error.message);
    return res.status(500).json({ error: 'Failed to create proof.', details: error.message });
  }
};

module.exports = {
  createProof
};
