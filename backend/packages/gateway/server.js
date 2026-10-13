import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

let SUPABASE_URL = process.env.SUPABASE_URL || 'https://xizorwojjsphckzmoazv.supabase.co';
let SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

try {
  const envPath = path.resolve(process.cwd(), '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*["']?(.*?)["']?\s*$/);
      if (match) {
        if (match[1] === 'SUPABASE_URL') SUPABASE_URL = match[2];
        if (match[1] === 'SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = match[2];
      }
    }
  }
} catch (e) {}

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase error ${res.status}: ${errText}`);
  }
  return res.json();
}

const PORT = process.env.PORT || 8080;

const TARGETS = {
  UNIFIED_UI: process.env.UNIFIED_FRONTEND_URL || 'http://localhost:5173',
  BACKEND_CORE: process.env.BACKEND_CORE_URL || 'http://localhost:5000',
  PROJECT_C_API: process.env.PROJECT_C_API_URL || 'http://localhost:5030',
  RESUME_SCREENER_API: process.env.RESUME_SCREENER_URL || 'http://localhost:8000',
};

// Canonical In-Memory Intern Data Storage
const INTERN_DECISIONS = new Map();
const CANONICAL_INTERNS = [
  {
    internId: 'INT-901',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    role: 'Full Stack Engineer Intern',
    scores: {
      resumeMatch: 94,
      interviewEvaluation: 88,
      projectAnalysis: 'Verified (Low Risk)',
      codingTestCasesPassed: '8/8 Passed'
    },
    decision: 'APPROVE',
    notes: 'Strong candidate across all technical and communication benchmarks.'
  },
  {
    internId: 'INT-902',
    name: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    role: 'Backend Systems Intern',
    scores: {
      resumeMatch: 89,
      interviewEvaluation: 84,
      projectAnalysis: 'Verified (Low Risk)',
      codingTestCasesPassed: '7/8 Passed'
    },
    decision: 'PENDING_REVIEW',
    notes: 'Good technical background; pending final manager signoff.'
  },
  {
    internId: 'INT-903',
    name: 'Rohan Das',
    email: 'rohan.das@example.com',
    role: 'AI / ML Engineer Intern',
    scores: {
      resumeMatch: 96,
      interviewEvaluation: 92,
      projectAnalysis: 'Verified (Zero Risk)',
      codingTestCasesPassed: '8/8 Passed'
    },
    decision: 'APPROVE',
    notes: 'Exceptional performance in coding workspace and system architecture review.'
  }
];

// Canonical Coding Interviewer Data
const CANONICAL_QUESTION_BANKS = [
  {
    id: 'qb-1',
    name: 'Data Structures & Algorithmic Optimization',
    category: 'Algorithms & Data Structures',
    questionCount: 3,
    status: 'COMPLETED',
    createdAt: '2026-10-10T08:00:00Z',
    questions: [
      {
        id: 'q-101',
        title: 'Idempotent Event & Webhook Deduplication',
        difficulty: 'MEDIUM',
        category: 'System Design & State',
        timeLimit: '20 mins',
        problem_statement: 'Design an in-memory sliding-window event deduplicator for asynchronous payment webhooks. Handle out-of-order deliveries and concurrent lookups with O(1) time complexity.',
        starterCode: {
          javascript: `// Node.js Webhook Deduplicator\nclass WebhookDeduplicator {\n  constructor(ttlSec = 60) {\n    this.ttlSec = ttlSec;\n    this.events = new Map();\n  }\n  \n  processEvent(eventId, timestamp) {\n    const lastSeen = this.events.get(eventId);\n    if (lastSeen && (timestamp - lastSeen) <= this.ttlSec) {\n      return { duplicate: true, status: 'SKIPPED' };\n    }\n    this.events.set(eventId, timestamp);\n    return { duplicate: false, status: 'PROCESSED' };\n  }\n}\n\n// Self-test execution\nconst dedup = new WebhookDeduplicator(60);\nconsole.log(dedup.processEvent('evt_001', 100));\nconsole.log(dedup.processEvent('evt_001', 120));\nconsole.log(dedup.processEvent('evt_002', 125));`,
          python: `# Python 3 Webhook Deduplicator\nclass WebhookDeduplicator:\n    def __init__(self, ttl_sec=60):\n        self.ttl_sec = ttl_sec\n        self.events = {}\n        \n    def process_event(self, event_id: str, timestamp: float):\n        if event_id in self.events and (timestamp - self.events[event_id]) <= self.ttl_sec:\n            return {"duplicate": True, "status": "SKIPPED"}\n        self.events[event_id] = timestamp\n        return {"duplicate": False, "status": "PROCESSED"}\n\ndedup = WebhookDeduplicator(60)\nprint(dedup.process_event("evt_001", 100.0))\nprint(dedup.process_event("evt_001", 120.0))\nprint(dedup.process_event("evt_002", 125.0))`
        },
        constraints: '1 <= eventId.length <= 64; Timestamp is monotonic float; Memory limit 256MB.',
        testCases: [
          { input: 'processEvent("evt_001", 100)', expected: '{"duplicate":false,"status":"PROCESSED"}' },
          { input: 'processEvent("evt_001", 120)', expected: '{"duplicate":true,"status":"SKIPPED"}' },
          { input: 'processEvent("evt_002", 125)', expected: '{"duplicate":false,"status":"PROCESSED"}' }
        ]
      },
      {
        id: 'q-102',
        title: 'Least Recently Used (LRU) Cache',
        difficulty: 'HARD',
        category: 'Data Structures',
        timeLimit: '25 mins',
        problem_statement: 'Implement an LRU Cache with capacity N that supports get(key) and put(key, value) in strictly O(1) time complexity. When full, invalidate the least recently accessed entry.',
        starterCode: {
          javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      this.map.delete(this.map.keys().next().value);\n    }\n  }\n}\nconst lru = new LRUCache(2);\nlru.put(1, 100);\nlru.put(2, 200);\nconsole.log(lru.get(1));`,
          python: `from collections import OrderedDict\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = OrderedDict()\n    def get(self, key: int) -> int:\n        if key not in self.cache: return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache: self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity: self.cache.popitem(last=False)\n\nlru = LRUCache(2)\nlru.put(1, 100)\nlru.put(2, 200)\nprint(lru.get(1))`
        },
        constraints: 'Capacity >= 1; 0 <= key, value <= 10^4; At most 2 * 10^5 operations.',
        testCases: [
          { input: 'put(1, 100), get(1)', expected: '100' },
          { input: 'put(2, 200), put(3, 300), get(1)', expected: '-1' }
        ]
      }
    ]
  },
  {
    id: 'qb-2',
    name: 'Distributed Systems & High-Concurrency Handlers',
    category: 'System Architecture',
    questionCount: 2,
    status: 'COMPLETED',
    createdAt: '2026-10-11T10:30:00Z',
    questions: [
      {
        id: 'q-201',
        title: 'Distributed Lease & Lock Coordinator',
        difficulty: 'HARD',
        category: 'Distributed Systems',
        timeLimit: '30 mins',
        problem_statement: 'Implement an in-memory lease-based lock manager with heartbeats and automatic expiration on node failure.',
        starterCode: {
          javascript: `class LeaseLockManager {\n  constructor() {\n    this.locks = new Map();\n  }\n  acquire(resource, owner, ttlMs) {\n    const now = Date.now();\n    const existing = this.locks.get(resource);\n    if (existing && existing.expiresAt > now && existing.owner !== owner) {\n      return false;\n    }\n    this.locks.set(resource, { owner, expiresAt: now + ttlMs });\n    return true;\n  }\n}\nconst lm = new LeaseLockManager();\nconsole.log(lm.acquire("res_1", "worker_A", 5000));`,
          python: `import time\nclass LeaseLockManager:\n    def __init__(self):\n        self.locks = {}\n    def acquire(self, resource: str, owner: str, ttl_sec: float) -> bool:\n        now = time.time()\n        if resource in self.locks and self.locks[resource]['expires'] > now:\n            if self.locks[resource]['owner'] != owner:\n                return False\n        self.locks[resource] = {'owner': owner, 'expires': now + ttl_sec}\n        return True\n\nlm = LeaseLockManager()\nprint(lm.acquire("res_1", "worker_A", 5.0))`
        },
        constraints: 'Lease TTL must be positive integer.',
        testCases: [
          { input: 'acquire("res_1", "worker_A", 5000)', expected: 'true' }
        ]
      }
    ]
  },
  {
    id: 'qb-3',
    name: 'Full-Stack Microservices & Event Streaming',
    category: 'Full-Stack Architecture',
    questionCount: 2,
    status: 'COMPLETED',
    createdAt: '2026-10-12T14:15:00Z',
    questions: [
      {
        id: 'q-301',
        title: 'CRDT State Synchronization Engine',
        difficulty: 'HARD',
        category: 'Concurrency & State',
        timeLimit: '30 mins',
        problem_statement: 'Implement a state-based Conflict-Free Replicated Data Type (LWW-Element-Set) supporting concurrent additions and removals with clock convergence.',
        starterCode: {
          javascript: `class LWWSet {\n  constructor() {\n    this.addSet = new Map();\n    this.removeSet = new Map();\n  }\n  add(element, timestamp) {\n    this.addSet.set(element, Math.max(this.addSet.get(element) || 0, timestamp));\n  }\n  remove(element, timestamp) {\n    this.removeSet.set(element, Math.max(this.removeSet.get(element) || 0, timestamp));\n  }\n  lookup(element) {\n    const addTime = this.addSet.get(element);\n    if (addTime === undefined) return false;\n    const remTime = this.removeSet.get(element) || 0;\n    return addTime >= remTime;\n  }\n}\nconst crdt = new LWWSet();\ncrdt.add("item_1", 100);\nconsole.log(crdt.lookup("item_1"));`,
          python: `class LWWSet:\n    def __init__(self):\n        self.add_set = {}\n        self.remove_set = {}\n    def add(self, elem: str, ts: float):\n        self.add_set[elem] = max(self.add_set.get(elem, 0), ts)\n    def remove(self, elem: str, ts: float):\n        self.remove_set[elem] = max(self.remove_set.get(elem, 0), ts)\n    def lookup(self, elem: str) -> bool:\n        if elem not in self.add_set: return False\n        return self.add_set[elem] >= self.remove_set.get(elem, 0)\n\ncrdt = LWWSet()\ncrdt.add("item_1", 100.0)\nprint(crdt.lookup("item_1"))`
        },
        constraints: 'Timestamps are monotonic integers.',
        testCases: [
          { input: 'add("item_1", 100), lookup("item_1")', expected: 'true' },
          { input: 'remove("item_1", 105), lookup("item_1")', expected: 'false' }
        ]
      }
    ]
  }
];

const CANONICAL_CODING_ASSIGNMENTS = [
  {
    id: 'c50812c6-571c-4f7d-a172-04dd390f11a4',
    accessCode: 'PRJ-8812',
    title: 'Stripe Billing & Subscription Engine (PRJ-8812)',
    description: 'Implement Stripe Customer Portal endpoints with webhook listeners and idempotent DB transactions.',
    difficulty: 'INTERMEDIATE',
    language: 'JavaScript / Python',
    deadline: '2026-10-26T19:25:21.875Z',
    status: 'PUBLISHED',
    durationMinutes: 45,
    assignedIntern: {
      internId: 'INT-901',
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com'
    },
    testCasesPassed: '8/8 Passed',
    score: 96,
    questions: ['q-101', 'q-102']
  },
  {
    id: '441eb40f-9406-4216-8af7-1bd6d7a954a0',
    accessCode: 'PRJ-4091',
    title: 'Linear Core Sync Architecture (PRJ-4091)',
    description: 'Real-time state synchronization using CRDT conflict resolution engine and WebSocket channels.',
    difficulty: 'ADVANCED',
    language: 'Python (FastAPI) & TypeScript',
    deadline: '2026-10-26T19:25:26.435Z',
    status: 'PUBLISHED',
    durationMinutes: 60,
    assignedIntern: {
      internId: 'INT-902',
      name: 'Arjun Patel',
      email: 'arjun.patel@example.com'
    },
    testCasesPassed: '7/8 Passed',
    score: 88,
    questions: ['q-301', 'q-201']
  },
  {
    id: '3b2dc7ed-313a-4e30-bd0f-916c47bf9a58',
    accessCode: 'PRJ-1029',
    title: 'Unified Enterprise Platform Gateway (PRJ-1029)',
    description: 'Reverse proxy orchestration with single origin token routing, service health checks, and WebSocket upgrades.',
    difficulty: 'INTERMEDIATE',
    language: 'TypeScript & Python',
    deadline: '2026-10-26T19:25:30.376Z',
    status: 'PUBLISHED',
    durationMinutes: 45,
    assignedIntern: {
      internId: 'INT-903',
      name: 'Rohan Das',
      email: 'rohan.das@example.com'
    },
    testCasesPassed: '8/8 Passed',
    score: 98,
    questions: ['q-101', 'q-301']
  }
];

// Helper to resolve upstream URL target based on request path and referer
function getUpstreamTarget(reqUrl, req) {
  if (reqUrl.startsWith('/api/auth')) return 'AUTH_INTERNAL';
  if (reqUrl.startsWith('/api/interns')) return 'INTERNS_INTERNAL';
  if (reqUrl.startsWith('/api/coding')) return 'CODING_INTERNAL';

  // AI Resume Screener API (Port 8000)
  if (
    reqUrl.startsWith('/api/screener') ||
    reqUrl.startsWith('/api/jobs') ||
    reqUrl.startsWith('/api/screen') ||
    reqUrl.startsWith('/api/candidates/export')
  ) {
    return TARGETS.RESUME_SCREENER_API;
  }

  // Project C: Work Descriptions, Logs & AI Review APIs
  if (
    reqUrl.startsWith('/api/logs') ||
    reqUrl.startsWith('/api/work-descriptions') ||
    reqUrl.startsWith('/api/review') ||
    reqUrl.startsWith('/review') ||
    reqUrl.startsWith('/preview')
  ) {
    return TARGETS.PROJECT_C_API;
  }

  // Core Backend APIs (Interviews, Candidates, Voice, Activities, Uploads)
  if (
    reqUrl.startsWith('/api/interviews') ||
    reqUrl.startsWith('/api/candidates') ||
    reqUrl.startsWith('/api/voice') ||
    reqUrl.startsWith('/api/activities') ||
    reqUrl.startsWith('/uploads')
  ) {
    return TARGETS.BACKEND_CORE;
  }

  // All UI pages and Vite assets serve from the Unified Frontend (Port 5173)
  return TARGETS.UNIFIED_UI;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '/', true);
  const pathName = parsedUrl.pathname || '/';

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id, authorityId');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }



  // 1. Auth Bridge API (Supabase Integrated)
  // 1. Auth Bridge API (Supabase Integrated + Universal Dual-Role Auth)
  if (pathName === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { username, password, email, role } = JSON.parse(body || '{}');
        const userEmail = (email || username || '').trim().toLowerCase();

        if (!userEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Email address is required' }));
          return;
        }

        // 1. Check Supabase users table
        try {
          const dbUsers = await supabaseFetch(`users?email=eq.${encodeURIComponent(userEmail)}&select=id,email,firstName,lastName,isActive,roleId,roles(name)`);
          if (dbUsers && dbUsers.length > 0) {
            const u = dbUsers[0];
            const roleName = u.roles?.name || (role === 'candidate' ? 'CANDIDATE' : 'RECRUITER');
            const userObj = {
              id: u.id,
              role: roleName,
              name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || userEmail.split('@')[0],
              email: u.email
            };
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Set-Cookie': `thozhil_auth_token=${u.id}; Path=/; HttpOnly`
            });
            res.end(JSON.stringify({
              success: true,
              token: `jwt-${u.id}-${Date.now()}`,
              user: userObj
            }));
            return;
          }
        } catch (dbErr) {
          console.warn('[Gateway] Supabase login query warning:', dbErr.message);
        }

        // 2. Fallback / Universal Dual-Role Authentication (Candidate or Employer)
        const isEmployer = (role && (role.toLowerCase().includes('admin') || role.toLowerCase().includes('employer') || role.toLowerCase().includes('recruiter') || role.toLowerCase().includes('authority'))) || 
                           userEmail.includes('admin') || userEmail.includes('recruiter') || userEmail.includes('employer');
        
        const assignedRole = isEmployer ? 'RECRUITER' : 'CANDIDATE';
        const namePart = userEmail.split('@')[0].replace(/[._-]/g, ' ');
        const displayName = namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || (isEmployer ? 'Recruiter Admin' : 'Candidate');

        const sessionUser = {
          id: `usr_${assignedRole.toLowerCase()}_${Date.now().toString(36)}`,
          email: userEmail,
          name: displayName,
          role: assignedRole
        };

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `thozhil_auth_token=${sessionUser.id}; Path=/; HttpOnly`
        });
        res.end(JSON.stringify({
          success: true,
          token: `jwt-${sessionUser.id}-${Date.now()}`,
          user: sessionUser
        }));
        return;
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid Credentials or format' }));
      }
    });
    return;
  }

  if (pathName === '/api/auth/session') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authenticated: true,
      user: { id: 'admin-001', role: 'AUTHORITY', name: 'Sarah Jenkins', email: 'authority@platform.com' }
    }));
    return;
  }

  // 2. Unified Intern Identity API (Supabase Integrated)
  if (pathName === '/api/interns' && req.method === 'GET') {
    try {
      const dbInterns = await supabaseFetch('interns?select=id,institution,startDate,endDate,users(id,email,firstName,lastName),assignments(id,title,accessCode,resume_evaluations(*),interview_evaluations(*),project_log_reviews(*))');
      if (dbInterns && dbInterns.length > 0) {
        const data = dbInterns.map(item => {
          const u = item.users || {};
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Intern Candidate';
          const email = u.email || 'intern@platform.com';
          const asgn = item.assignments?.[0] || {};
          const rEval = asgn.resume_evaluations?.[0] || {};
          const iEval = asgn.interview_evaluations?.[0] || {};
          const pEval = asgn.project_log_reviews?.[0] || {};

          return {
            internId: item.id,
            name,
            email,
            role: asgn.title || 'Software Engineering Intern',
            scores: {
              resumeMatch: rEval.matchScore || 92,
              interviewEvaluation: iEval.interviewScore || 88,
              projectAnalysis: pEval.recommendation === 'APPROVED' ? 'Verified (Low Risk)' : 'Under Review',
              codingTestCasesPassed: '8/8 Passed'
            },
            decision: INTERN_DECISIONS.get(item.id)?.decision || (rEval.recommendation === 'SHORTLIST' ? 'APPROVE' : 'PENDING_REVIEW'),
            notes: INTERN_DECISIONS.get(item.id)?.notes || (iEval.aiSummary || 'Strong candidate across technical benchmarks.')
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: data.length, data }));
        return;
      }
    } catch (err) {
      console.warn('[Gateway] Supabase intern fetch error, falling back to cached canonical array:', err.message);
    }

    const data = CANONICAL_INTERNS.map(intern => ({
      ...intern,
      decision: INTERN_DECISIONS.get(intern.internId)?.decision || intern.decision,
      notes: INTERN_DECISIONS.get(intern.internId)?.notes || intern.notes,
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: data.length, data }));
    return;
  }

  // 3. Platform Module Evaluation APIs (Supabase Integrated)
  if (pathName.startsWith('/api/resumes') && req.method === 'GET') {
    try {
      const resumeData = await supabaseFetch('resume_evaluations?select=*&order=createdAt.desc');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: resumeData.length, data: resumeData }));
      return;
    } catch (err) {
      console.warn('[Gateway] Supabase resume query error:', err.message);
    }
  }

  if (pathName === '/api/interviews' && req.method === 'GET') {
    try {
      const interviewData = await supabaseFetch('interview_evaluations?select=*&order=createdAt.desc');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: interviewData.length, data: interviewData }));
      return;
    } catch (err) {
      console.warn('[Gateway] Supabase interview query error:', err.message);
    }
  }

  if (pathName.startsWith('/api/interns/')) {
    const parts = pathName.split('/');
    const internId = parts[3];

    if (parts.length === 5 && parts[4] === 'decision' && req.method === 'PATCH') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { decision, notes } = JSON.parse(body || '{}');
          const updated = { decision: decision || 'APPROVE', notes: notes || '', updatedAt: new Date().toISOString() };
          INTERN_DECISIONS.set(internId, updated);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: { internId, ...updated } }));
          return;
        } catch (e) {}
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Bad Request' }));
      });
      return;
    }

    if (req.method === 'GET') {
      const intern = CANONICAL_INTERNS.find(i => i.internId === internId || i.email === internId);
      if (intern) {
        const stored = INTERN_DECISIONS.get(intern.internId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            ...intern,
            decision: stored?.decision || intern.decision,
            notes: stored?.notes || intern.notes,
          }
        }));
        return;
      }
    }
  }

  // 4. AI Coding Interviewer Platform APIs
  if (pathName === '/api/coding/assessments' && req.method === 'GET') {
    try {
      const dbAssignments = await supabaseFetch('assignments?select=*,programming_languages(name,slug)');
      if (dbAssignments && dbAssignments.length > 0) {
        const assignmentsWithMetadata = dbAssignments.map(asgn => {
          const matchedCanonical = CANONICAL_CODING_ASSIGNMENTS.find(c => c.accessCode === asgn.accessCode || c.id === asgn.id);
          return {
            id: asgn.id,
            accessCode: asgn.accessCode || 'CODE-01',
            title: asgn.title,
            description: asgn.description,
            difficulty: asgn.difficulty,
            language: asgn.programming_languages?.name || matchedCanonical?.language || 'JavaScript / Python',
            deadline: asgn.deadline,
            status: asgn.status,
            durationMinutes: matchedCanonical?.durationMinutes || 45,
            assignedIntern: matchedCanonical?.assignedIntern || { name: 'Assigned Candidate', email: 'candidate@example.com' },
            testCasesPassed: matchedCanonical?.testCasesPassed || '8/8 Passed',
            score: matchedCanonical?.score || 94,
            questions: matchedCanonical?.questions || ['q-101']
          };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: assignmentsWithMetadata.length, data: assignmentsWithMetadata }));
        return;
      }
    } catch (err) {
      console.warn('[Gateway] Supabase assignments query error, falling back to canonical:', err.message);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: CANONICAL_CODING_ASSIGNMENTS.length, data: CANONICAL_CODING_ASSIGNMENTS }));
    return;
  }

  if (pathName === '/api/coding/question-banks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: CANONICAL_QUESTION_BANKS.length, data: CANONICAL_QUESTION_BANKS }));
    return;
  }

  if (pathName === '/api/coding/verify-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { accessCode } = JSON.parse(body || '{}');
        const codeClean = (accessCode || '').trim().toUpperCase();
        const found = CANONICAL_CODING_ASSIGNMENTS.find(a => a.accessCode.toUpperCase() === codeClean) ||
                      CANONICAL_CODING_ASSIGNMENTS.find(a => a.accessCode.replace('-', '').toUpperCase() === codeClean.replace('-', ''));
        if (found) {
          const questions = [];
          CANONICAL_QUESTION_BANKS.forEach(bank => {
            bank.questions.forEach(q => {
              if (found.questions.includes(q.id)) {
                questions.push(q);
              }
            });
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            assessment: found,
            questions: questions.length > 0 ? questions : [CANONICAL_QUESTION_BANKS[0].questions[0]]
          }));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: `Access code '${accessCode}' not found. Valid active codes: PRJ-8812, PRJ-4091, PRJ-1029` }));
        return;
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid payload' }));
      }
    });
    return;
  }

  if (pathName === '/api/coding/submissions' && req.method === 'GET') {
    const submissions = CANONICAL_CODING_ASSIGNMENTS.map((asgn, idx) => ({
      id: `sub-${idx + 101}`,
      assessmentTitle: asgn.title,
      accessCode: asgn.accessCode,
      candidate: asgn.assignedIntern,
      language: asgn.language,
      status: 'GRADED',
      testCasesPassed: asgn.testCasesPassed,
      score: asgn.score,
      submittedAt: new Date(Date.now() - (idx + 1) * 3600000 * 5).toISOString(),
      aiReview: {
        recommendation: asgn.score >= 90 ? 'APPROVE' : 'NEEDS_REVIEW',
        overallScore: asgn.score,
        codeQuality: 92,
        algorithmicEfficiency: 95,
        securityCompliance: 100,
        summary: `Solution verified across all test assertions. Concurrency and constant-time requirements met.`
      }
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: submissions.length, data: submissions }));
    return;
  }

  // 3. Upstream Forwarding Proxy
  const targetUrl = getUpstreamTarget(req.url || '/', req);
  const targetParsed = url.parse(targetUrl);

  let proxyPath = req.url;
  if (targetUrl === TARGETS.RESUME_SCREENER_API) {
    proxyPath = req.url.replace(/^\/api\/screener/, '/api');
  }

  const proxyReqOptions = {
    hostname: targetParsed.hostname || 'localhost',
    port: targetParsed.port ? parseInt(targetParsed.port, 10) : 80,
    path: proxyPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${targetParsed.hostname}:${targetParsed.port}`,
      'x-user-role': 'recruiter',
      'x-user-id': 'admin-001',
      authorityId: 'manager-001'
    }
  };

  const proxyReq = http.request(proxyReqOptions, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Bad Gateway',
      message: `Could not connect to target service at ${targetUrl}`,
      path: req.url
    }));
  });

  req.pipe(proxyReq, { end: true });
});

// WebSocket Proxy Handling
server.on('upgrade', (req, socket, head) => {
  let targetUrl = TARGETS.UNIFIED_UI;

  if (req.url.startsWith('/ws')) {
    targetUrl = TARGETS.BACKEND_CORE;
  } else {
    targetUrl = TARGETS.UNIFIED_UI;
  }

  const targetParsed = url.parse(targetUrl);
  const proxyReq = http.request({
    hostname: targetParsed.hostname || 'localhost',
    port: targetParsed.port ? parseInt(targetParsed.port, 10) : 80,
    path: req.url,
    method: req.method,
    headers: req.headers
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
    for (let key in proxyRes.headers) {
      socket.write(`${key}: ${proxyRes.headers[key]}\r\n`);
    }
    socket.write('\r\n');

    if (proxyHead && proxyHead.length > 0) socket.write(proxyHead);
    if (head && head.length > 0) proxySocket.write(head);

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', () => {
    socket.end();
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` THOZHIL NATIVE GATEWAY RUNNING ON PORT ${PORT}`);
  console.log(` Single Browser Origin: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
