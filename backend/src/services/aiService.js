// AI Service for proof analysis using Google Gemini.
// This module exports a single function `analyzeProof` that receives proof data,
// invokes the Gemini API, and returns a structured analysis object.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini client lazily to avoid startup errors when the API key is missing.
let genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set; AI analysis will fallback to placeholder response.');
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Build a prompt that instructs Gemini to evaluate the proof and return strict JSON.
 * @param {Object} proofData The proof payload received from the controller.
 * @returns {string} Prompt text.
 */
function buildPrompt(proofData) {
  const { goalId, githubUrl, websiteUrl, description, status, filePath } = proofData;
  return `You are an AI evaluator for the CredStreak accountability platform.
Analyze the following proof information and decide whether it demonstrates successful completion of the associated goal.
Provide ONLY a JSON object with the exact following keys (no extra text):
{
  "confidence": number (0-100),
  "completed": true|false,
  "strengths": [string],
  "missingEvidence": [string],
  "summary": string,
  "recommendation": string
}

Proof details:
Goal ID: ${goalId}
GitHub URL: ${githubUrl || 'N/A'}
Website URL: ${websiteUrl || 'N/A'}
Description: ${description}
Status: ${status}
Uploaded File Path: ${filePath}
`;
}

/**
 * Safely parse Gemini's response. If parsing fails, return a fallback object.
 */
function safeParse(jsonString) {
  try {
    // Remove any surrounding whitespace or markdown code fences.
    const cleaned = jsonString.trim().replace(/^```json\n/, '').replace(/^```\n/, '').replace(/```$/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', e.message);
    return null;
  }
}

/**
 * Analyse a proof using Gemini. Returns an object with the required fields.
 * @param {Object} proofData The proof information object.
 * @returns {Promise<Object>} Analysis result.
 */
async function analyzeProof(proofData) {
  const genAI = getGenAI();
  if (!genAI) {
    // Graceful fallback when the API key is missing or client could not be created.
    return {
      confidence: 0,
      completed: false,
      strengths: [],
      missingEvidence: [],
      summary: 'Gemini API key not configured; unable to perform analysis.',
      recommendation: 'Manual review required.'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = buildPrompt(proofData);
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    const parsed = safeParse(responseText);
    if (parsed && typeof parsed === 'object') {
      // Ensure all expected keys exist; otherwise fallback to placeholder values.
      return {
        confidence: parsed.confidence ?? 0,
        completed: parsed.completed ?? false,
        strengths: parsed.strengths ?? [],
        missingEvidence: parsed.missingEvidence ?? [],
        summary: parsed.summary ?? '',
        recommendation: parsed.recommendation ?? ''
      };
    }
  } catch (err) {
    console.error('Error during Gemini analysis:', err.message);
    // Fall back to a generic placeholder response.
  }

  // Generic fallback if anything went wrong.
  return {
    confidence: 0,
    completed: false,
    strengths: [],
    missingEvidence: [],
    summary: 'AI analysis failed; returned default values.',
    recommendation: 'Manual review required.'
  };
}

module.exports = {
  analyzeProof
};
