require('dotenv').config();
const { analyzeProof } = require('./src/services/aiService');

async function test() {
  const result = await analyzeProof({
    challengeId: "test",
    description: "test proof",
    status: "active",
    filePath: null
  });
  console.log("AI RESULT:", JSON.stringify(result, null, 2));
}

test();
