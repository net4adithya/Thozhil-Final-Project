/**
 * Gemini AI Code Review Service
 *
 * Calls Gemini to evaluate a candidate's coding submission and returns a structured
 * review with code quality, correctness, time/space complexity, and suggestions.
 *
 * Requires GEMINI_API_KEY in .env. Falls back gracefully if the key is absent
 * or the API is unavailable — the review field is set to null, which the frontend
 * renders as "AI review not available".
 */

const https = require('https');

const MODEL = 'gemini-1.5-flash';

function geminiRequest(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400 || parsed.error) {
            return reject(new Error(`Gemini API Error ${res.statusCode}: ${parsed.error?.message || data}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON from Gemini: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Gemini API connection timed out')); });
    req.write(body);
    req.end();
  });
}

/**
 * Reviews a coding submission using Gemini.
 */
async function reviewCode({ questionTitle, questionStatement, code, language, passedCount, totalCount }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[gemini] GEMINI_API_KEY not set in process.env — skipping AI review');
    return {
      error: 'GEMINI_API_KEY is not configured in process.env',
      overallScore: 0,
      overallReview: 'AI Review not available — GEMINI_API_KEY is missing in backend .env file.',
      correctnessAnalysis: 'GEMINI_API_KEY not provided.',
      algorithmAnalysis: 'N/A',
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      readability: 'N/A',
      maintainability: 'N/A',
      securityPerformanceFindings: 'N/A',
      strengths: [],
      improvements: ['Set GEMINI_API_KEY in assessment-backend/.env to enable automated AI reviews.']
    };
  }

  const prompt = `You are an expert technical interviewer reviewing a candidate's coding assessment submission.

Problem Title: "${questionTitle}"
Problem Statement: ${(questionStatement || '').slice(0, 800)}

Candidate Code (${language}):
\`\`\`${language}
${(code || '').slice(0, 3000)}
\`\`\`

Test Results: ${passedCount}/${totalCount} test cases passed.

Provide a detailed technical review in JSON format with these exact keys:
{
  "overallScore": <number 0-100>,
  "overallReview": <string>,
  "correctnessAnalysis": <string>,
  "algorithmAnalysis": <string>,
  "timeComplexity": <string>,
  "spaceComplexity": <string>,
  "readability": <string>,
  "maintainability": <string>,
  "securityPerformanceFindings": <string>,
  "strengths": [<string>],
  "improvements": [<string>]
}

Return ONLY valid JSON. No markdown code blocks, no backticks outside the JSON.`;

  try {
    const response = await geminiRequest(prompt);
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No JSON found in Gemini response: ${text.slice(0, 200)}`);

    const review = JSON.parse(jsonMatch[0]);
    console.log(`[gemini] reviewed "${questionTitle}" — score: ${review.overallScore}`);
    return review;
  } catch (err) {
    console.error('[gemini] review failed:', err.message);
    return {
      error: err.message,
      overallScore: 0,
      overallReview: `Gemini Review Error: ${err.message}`,
      correctnessAnalysis: 'Failed to process AI review.',
      algorithmAnalysis: 'N/A',
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      readability: 'N/A',
      maintainability: 'N/A',
      securityPerformanceFindings: 'N/A',
      strengths: [],
      improvements: [`Fix Gemini API issue: ${err.message}`]
    };
  }
}

module.exports = { reviewCode };
