const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, '../../data');
const storeFile = path.join(storeDir, 'challenges.json');

if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

const readChallenges = () => {
  if (!fs.existsSync(storeFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(storeFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
};

const saveChallengeLocally = (challengeData) => {
  const challenges = readChallenges();
  const newChallenge = {
    _id: `local-challenge-${Date.now()}`,
    ...challengeData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  challenges.unshift(newChallenge);

  try {
    fs.writeFileSync(storeFile, JSON.stringify(challenges, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write local challenges store:', error.message);
  }

  return newChallenge;
};

module.exports = {
  readChallenges,
  saveChallengeLocally
};
