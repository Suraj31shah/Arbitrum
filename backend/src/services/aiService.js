// AI Service for proof analysis using Google Gemini via @google/genai SDK.
// This module exports a single function `analyzeProof` that receives proof data,
// invokes the Gemini API, and returns a structured analysis object.

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set; AI analysis will fallback to default response.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/** Build prompt for Gemini */
function buildPrompt(proofData) {
  const { challengeId, githubUrl, websiteUrl, description, status, integrationData } = proofData;
  const SYSTEM_PROMPT = `You are the CommitX AI Validator.
Your job is to determine whether a user successfully completed their commitment based on the provided evidence.

CommitX is an accountability platform where users stake cryptocurrency on their goals.
Your decision determines whether their stake is returned or sent to charity, so you must be strict, objective, and fair. Decide whether the proof genuinely demonstrates successful completion of the associated challenge.

If "Integration Telemetry" is provided, you MUST explicitly mention those exact API statistics in your "summary" and "strengths" to prove to the user that you verified their 3rd-party app data.

Provide ONLY a JSON object with the exact following keys (no markdown code blocks, no extra text):
{
  "confidence": number (0-100),
  "completed": true|false,
  "strengths": [string],
  "missingEvidence": [string],
  "summary": string,
  "recommendation": string
}

Proof details:
Challenge ID: ${challengeId}
GitHub URL: ${githubUrl || 'N/A'}
Website URL: ${websiteUrl || 'N/A'}
Description: ${description}
Integration Telemetry (Auto-fetched data from 3rd Party APIs): 
${integrationData || 'No telemetry provided for this challenge.'}

Status: ${status}
`;
}

/** Safely parse Gemini JSON response */
function safeParse(jsonString) {
  try {
    const cleaned = jsonString
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```$/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', e.message, 'Raw response:', jsonString);
    return null;
  }
}

/** Prepare file payload for Gemini multimodal input */
function getFilePart(filePath) {
  if (!filePath) return null;
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) return null;

  const ext = path.extname(absolutePath).toLowerCase();
  let mimeType = 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
  else if (ext === '.webp') mimeType = 'image/webp';
  else if (ext === '.gif') mimeType = 'image/gif';
  else if (ext === '.pdf') mimeType = 'application/pdf';

  const base64Data = fs.readFileSync(absolutePath).toString('base64');
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };
}

/** Analyze proof using Gemini */
async function analyzeProof(proofData) {
  let ai;
  try {
    ai = getAIClient();
  } catch (initErr) {
    console.error('Failed to initialize Gemini client:', initErr.message);
    return {
      confidence: 0,
      completed: false,
      strengths: [],
      missingEvidence: [],
      summary: `Gemini client initialization failed: ${initErr.message}`,
      recommendation: 'Check GEMINI_API_KEY configuration.'
    };
  }

  if (!ai) {
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
    const promptText = buildPrompt(proofData);
    const contents = [promptText];

    const filePart = getFilePart(proofData.filePath);
    if (filePart) {
      contents.push(filePart);
    }

    let responseText = '';
    let lastError = null;

    // Try models in order of availability (using active Gemini model aliases)
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-pro-latest', 'gemini-2.0-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    const parsed = safeParse(responseText);
    if (parsed && typeof parsed === 'object') {
      return {
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        completed: Boolean(parsed.completed),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence : [],
        summary: parsed.summary || 'Analysis complete.',
        recommendation: parsed.recommendation || ''
      };
    }
  } catch (err) {
    console.error('Error during Gemini API call:', err);
    return {
      confidence: 0,
      completed: false,
      strengths: [],
      missingEvidence: [],
      summary: `AI analysis error: ${err.message}`,
      recommendation: 'Verify GEMINI_API_KEY in backend/.env or check internet connection.'
    };
  }

  return {
    confidence: 0,
    completed: false,
    strengths: [],
    missingEvidence: [],
    summary: 'AI analysis failed to parse valid response.',
    recommendation: 'Manual review required.'
  };
}

module.exports = { analyzeProof };
