const fs = require('fs');
const path = require('path');

const storeDir = path.join(__dirname, '../../data');
const storeFile = path.join(storeDir, 'proofs.json');

if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

const readProofs = () => {
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

const writeProofs = (proofs) => {
  fs.writeFileSync(storeFile, JSON.stringify(proofs, null, 2));
};

const saveProofLocally = (proofData) => {
  const proofs = readProofs();
  const storedProof = {
    ...proofData,
    _id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'local-fallback'
  };

  proofs.push(storedProof);
  writeProofs(proofs);
  return storedProof;
};

module.exports = {
  saveProofLocally
};
