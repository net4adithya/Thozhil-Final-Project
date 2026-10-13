// Test script to verify the AI Log Review Backend implementation.
// This script mocks the Supabase database and Anthropic Claude API responses.

const http = require('http');

// Setup mock database state
let dbData = {
  WorkDescription: [],
  Log: [],
  Review: []
};

function resetDb() {
  dbData.WorkDescription = [];
  dbData.Log = [];
  dbData.Review = [];
}

// In-memory query builder mock for Supabase
const makeQueryChain = (queryData, table) => {
  const chain = {
    eq: (field, value) => {
      const filtered = queryData.filter(row => row[field] === value);
      return makeQueryChain(filtered, table);
    },
    order: (orderField, { ascending = true } = {}) => {
      const sorted = [...queryData].sort((a, b) => {
        const valA = a[orderField];
        const valB = b[orderField];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
      return makeQueryChain(sorted, table);
    },
    limit: (limitNum) => {
      const limited = queryData.slice(0, limitNum);
      return makeQueryChain(limited, table);
    },
    maybeSingle: async () => {
      return { data: queryData[0] || null, error: null };
    },
    single: async () => {
      return { data: queryData[0] || null, error: null };
    },
    then: (onfulfilled) => {
      return Promise.resolve({ data: queryData, error: null }).then(onfulfilled);
    }
  };
  return chain;
};

const mockSupabase = {
  from: (table) => {
    return {
      select: (fields = '*') => {
        return makeQueryChain(dbData[table] || [], table);
      },
      insert: (rows) => {
        const insertedRows = rows.map(row => {
          const newRow = {
            id: 'uuid-' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            uploadedAt: new Date().toISOString(),
            ...row
          };
          if (!dbData[table]) dbData[table] = [];
          dbData[table].push(newRow);
          return newRow;
        });
        return {
          select: () => ({
            single: async () => {
              return { data: insertedRows[0], error: null };
            }
          })
        };
      }
    };
  }
};

// Set env vars
process.env.SUPABASE_URL = "https://wrtuivnykbsxhvfpysjc.supabase.co";
process.env.SUPABASE_KEY = "mock-supabase-key";
process.env.ANTHROPIC_API_KEY = "mock-anthropic-key";

// Inject mock Supabase client into require cache for db.js
require.cache[require.resolve('../db.js')] = {
  id: require.resolve('../db.js'),
  filename: require.resolve('../db.js'),
  loaded: true,
  exports: mockSupabase
};

// Mock fetch global for Anthropic messages API
let fetchCallCount = 0;
let fetchLastBody = null;
let fetchMockResponse = {
  status: 200,
  ok: true,
  json: async () => ({
    content: [
      { text: JSON.stringify({ score: 85, feedback: "Great work matching the description." }) }
    ]
  })
};

global.fetch = async (url, options) => {
  if (url.startsWith('https://generativelanguage.googleapis.com') || url === 'https://api.anthropic.com/v1/messages') {
    fetchCallCount++;
    fetchLastBody = JSON.parse(options.body);

    // If Gemini format, map contents text to look like Anthropic messages array for Test 6 assert check
    if (fetchLastBody.contents && fetchLastBody.contents[0]) {
      const promptText = fetchLastBody.contents[0].parts[0].text || '';
      fetchLastBody.messages = [
        { role: 'user', content: promptText }
      ];
    }
    
    const mockRes = typeof fetchMockResponse === 'function'
      ? await fetchMockResponse(fetchLastBody)
      : fetchMockResponse;
      
    if (url.startsWith('https://generativelanguage.googleapis.com')) {
      // Map Anthropic mock response structure to Gemini schema
      let textVal = '';
      try {
        const js = await mockRes.json();
        if (js.content && js.content[0]) {
          textVal = js.content[0].text;
        } else {
          textVal = typeof js === 'string' ? js : JSON.stringify(js);
        }
      } catch (err) {
        textVal = 'This is some non-json output that Claude might mistakenly return.';
      }

      return {
        status: mockRes.status,
        ok: mockRes.ok,
        text: async () => JSON.stringify({
          candidates: [{ content: { parts: [{ text: textVal }] } }]
        }),
        json: async () => ({
          candidates: [{ content: { parts: [{ text: textVal }] } }]
        })
      };
    }

    return {
      status: mockRes.status,
      ok: mockRes.ok,
      text: async () => JSON.stringify(await mockRes.json()),
      json: async () => mockRes.json()
    };
  }
  return { status: 404, ok: false };
};

// Start Express server
const app = require('../server.js');

// Helper to make local requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(body))
      } : {}
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test Runner
async function runTests() {
  console.log('--- STARTING AI LOG REVIEW BACKEND TESTS ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: POST /work-descriptions Validation
    // ----------------------------------------------------
    console.log('Testing: POST /work-descriptions Validation...');
    resetDb();
    const w1 = await makeRequest('POST', '/work-descriptions', { projectId: '', authorityId: 'a1', description: 'desc' });
    assert(w1.statusCode === 400 && w1.body.error.includes('projectId'), 'Rejects empty projectId');

    const w2 = await makeRequest('POST', '/work-descriptions', { projectId: 'p1', authorityId: '', description: 'desc' });
    assert(w2.statusCode === 400 && w2.body.error.includes('authorityId'), 'Rejects empty authorityId');

    const w3 = await makeRequest('POST', '/work-descriptions', { projectId: 'p1', authorityId: 'a1', description: '   ' });
    assert(w3.statusCode === 400 && w3.body.error.includes('description'), 'Rejects whitespace description');

    // ----------------------------------------------------
    // TEST 2: POST & GET /work-descriptions Success
    // ----------------------------------------------------
    console.log('\nTesting: POST and GET /work-descriptions Success...');
    const descData = { projectId: 'project-a', authorityId: 'auth-1', description: 'Build backend and integrate Supabase.' };
    const wCreate = await makeRequest('POST', '/work-descriptions', descData);
    assert(wCreate.statusCode === 201, 'Successfully creates a work description');
    assert(wCreate.body.projectId === 'project-a', 'Returned correct projectId');
    assert(wCreate.body.id !== undefined, 'Assigned UUID');

    const wGet = await makeRequest('GET', '/work-descriptions/project-a');
    assert(wGet.statusCode === 200, 'Successfully fetches work description');
    assert(wGet.body.description === descData.description, 'Returned latest description matching query');

    const wGet404 = await makeRequest('GET', '/work-descriptions/nonexistent-project');
    assert(wGet404.statusCode === 404, 'Returns 404 for non-existent project description');

    // ----------------------------------------------------
    // TEST 3: POST /logs Validation
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs Validation...');
    const l1 = await makeRequest('POST', '/logs', { projectId: '', internId: 'i1', content: 'content' });
    assert(l1.statusCode === 400 && l1.body.error.includes('projectId'), 'Rejects log with empty projectId');

    const l2 = await makeRequest('POST', '/logs', { projectId: 'p1', internId: '', content: 'content' });
    assert(l2.statusCode === 400 && l2.body.error.includes('internId'), 'Rejects log with empty internId');

    const l3 = await makeRequest('POST', '/logs', { projectId: 'p1', internId: 'i1', content: '  ' });
    assert(l3.statusCode === 400 && l3.body.error.includes('content'), 'Rejects log with empty/whitespace content');

    // ----------------------------------------------------
    // TEST 4: POST /logs without WorkDescription (review should be null)
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs without WorkDescription...');
    fetchCallCount = 0;
    const logDataNoDesc = { projectId: 'project-no-desc', internId: 'intern-1', content: 'Doing backend tests.' };
    const lCreateNoDesc = await makeRequest('POST', '/logs', logDataNoDesc);
    assert(lCreateNoDesc.statusCode === 201, 'Successfully creates a log when no work description exists');
    assert(lCreateNoDesc.body.review === null, 'Sets review to null since no work description existed');
    assert(lCreateNoDesc.body.descriptionId === null, 'Sets descriptionId to null');
    assert(fetchCallCount === 0, 'Did not call the LLM API');

    // ----------------------------------------------------
    // TEST 5: POST /logs with WorkDescription & LLM Review Success
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs with WorkDescription & LLM Review Success...');
    fetchCallCount = 0;
    fetchMockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        content: [
          { text: JSON.stringify({ score: 90, feedback: "Fantastic job matching the requirements." }) }
        ]
      })
    };

    const logData = { projectId: 'project-a', internId: 'intern-1', content: 'Implemented the database connection and the Express endpoints.' };
    const lCreate = await makeRequest('POST', '/logs', logData);
    assert(lCreate.statusCode === 201, 'Creates log and triggers review successfully');
    assert(lCreate.body.review !== null, 'Returned non-null review');
    assert(lCreate.body.review.score === 90, 'Review score matches mock response');
    assert(lCreate.body.review.feedback === 'Fantastic job matching the requirements.', 'Review feedback matches mock response');
    assert(lCreate.body.descriptionId === wCreate.body.id, 'Linked descriptionId correct');
    assert(fetchCallCount === 1, 'Called Anthropic messages API exactly once');

    // ----------------------------------------------------
    // TEST 6: POST /logs with under 10 words (should penalize)
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs with under 10 words (short logs)...');
    fetchCallCount = 0;
    const lShort = await makeRequest('POST', '/logs', { projectId: 'project-a', internId: 'intern-1', content: 'Wrote some code.' });
    assert(lShort.statusCode === 201, 'Allows creating short log');
    assert(fetchCallCount === 1, 'Called Anthropic messages API');
    assert(fetchLastBody.messages[0].content.includes('under 10 words'), 'Prompt contains penalize instructions for short logs');

    // ----------------------------------------------------
    // TEST 7: POST /logs with empty content (pre-check, score 0)
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs empty log content check (before LLM)...');
    // Note: since POST /logs already validates and returns 400 for empty string content,
    // let's check how the reviewLog function behaves directly for empty content.
    const { reviewLog } = require('../reviewer');
    const emptyReview = await reviewLog('Some expectations', '');
    assert(emptyReview.score === 0 && emptyReview.feedback.includes('No content was submitted'), 'reviewLog pre-checks and returns 0 score directly for empty content');

    // ----------------------------------------------------
    // TEST 8: POST /logs fallback on malformed LLM response
    // ----------------------------------------------------
    console.log('\nTesting: POST /logs fallback on malformed JSON from LLM...');
    fetchMockResponse = {
      status: 200,
      ok: true,
      json: async () => ({
        content: [
          { text: "This is some non-json output that Claude might mistakenly return." }
        ]
      })
    };

    const lMalformed = await makeRequest('POST', '/logs', { projectId: 'project-a', internId: 'intern-1', content: 'This test triggers malformed JSON response.' });
    assert(lMalformed.statusCode === 201, 'Still creates log successfully even when LLM fails');
    assert(lMalformed.body.review !== null, 'Provides review object');
    assert(lMalformed.body.review.score === null, 'Review score is null in fallback');
    assert(lMalformed.body.review.feedback.includes('Review could not be generated'), 'Feedback displays fallback error message');

    // ----------------------------------------------------
    // TEST 9: GET /logs/:projectId and permission checks
    // ----------------------------------------------------
    console.log('\nTesting: GET /logs/:projectId and permission checks...');
    // Without authorityId query param -> succeeds and returns logs
    const gNoAuth = await makeRequest('GET', '/logs/project-a');
    assert(gNoAuth.statusCode === 200, 'Fetches logs successfully without authorityId filter');
    assert(Array.isArray(gNoAuth.body) && gNoAuth.body.length > 0, 'Returned array of logs');

    // With correct authorityId -> succeeds
    const gCorrectAuth = await makeRequest('GET', '/logs/project-a?authorityId=auth-1');
    assert(gCorrectAuth.statusCode === 200, 'Fetches logs successfully with correct authorityId');

    // With incorrect authorityId -> 403 Forbidden
    const gWrongAuth = await makeRequest('GET', '/logs/project-a?authorityId=wrong-auth');
    assert(gWrongAuth.statusCode === 403, 'Returns 403 Forbidden for incorrect authorityId');

    // For nonexistent project description -> 403 Forbidden since authorityId cannot match
    const gNoProjectDesc = await makeRequest('GET', '/logs/project-no-desc?authorityId=auth-1');
    assert(gNoProjectDesc.statusCode === 403, 'Returns 403 Forbidden if project has no work description');

    // ----------------------------------------------------
    // TEST 10: GET /logs/:id/review
    // ----------------------------------------------------
    console.log('\nTesting: GET /logs/:id/review...');
    // Fetch review for log from Test 5
    const reviewGet = await makeRequest('GET', `/logs/${lCreate.body.id}/review`);
    assert(reviewGet.statusCode === 200, 'Fetches review successfully');
    assert(reviewGet.body.logId === lCreate.body.id, 'Returns correct review mapping');
    assert(reviewGet.body.score === 90, 'Returns correct score');

    // Fetch review for nonexistent log -> 404
    const reviewGet404 = await makeRequest('GET', `/logs/uuid-nonexistent/review`);
    assert(reviewGet404.statusCode === 404, 'Returns 404 for nonexistent log review');

  } catch (err) {
    console.error('Unexpected test runner error:', err);
    failed++;
  }

  console.log('\n--- TEST RESULTS SUMMARY ---');
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    process.exit(0);
  } else {
    console.error('\n❌ SOME TESTS FAILED. PLEASE DEBUG. ❌');
    process.exit(1);
  }
}

// Wait brief period for Express to start listening, then run tests
setTimeout(runTests, 1000);
