import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure data and uploads directories exist
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {}

const generateUUID = () => crypto.randomUUID();

const getDefaultSeedData = () => {
  const job1Id = '00000000-0000-0000-0000-000000000101';
  const job2Id = '00000000-0000-0000-0000-000000000102';
  const job3Id = '00000000-0000-0000-0000-000000000103';

  const int1Id = '11111111-1111-1111-1111-111111111111'; // async
  const int2Id = '22222222-2222-2222-2222-222222222222'; // live
  const int3Id = '33333333-3333-3333-3333-333333333333'; // async

  const cand1Id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const cand2Id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const cand3Id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const cand4Id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  const q1Id = '10000000-0000-0000-0000-000000000001';
  const q2Id = '10000000-0000-0000-0000-000000000002';
  const q3Id = '10000000-0000-0000-0000-000000000003';
  const q4Id = '20000000-0000-0000-0000-000000000001';
  const q5Id = '20000000-0000-0000-0000-000000000002';

  return {
    jobs: [
      {
        id: job1Id,
        title: 'Senior Distributed Systems Engineer',
        description: 'Design, build, and optimize high-throughput distributed architectures, consensus pipelines, and microservices.',
        department: 'Infrastructure',
        experience_level: 'Senior',
        required_skills: ['Distributed Systems', 'Go', 'Kafka', 'Consensus Algorithms'],
        preferred_skills: ['Raft', 'Kubernetes', 'Redis', 'gRPC'],
        location: 'San Francisco, CA / Remote',
        employment_type: 'Full-time',
        status: 'Active',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: job2Id,
        title: 'Principal Cloud Systems Engineer',
        description: 'Lead multi-region cloud topology, resiliency patterns, latency optimization, and automated failover.',
        department: 'Infrastructure',
        experience_level: 'Lead',
        required_skills: ['Cloud Architecture', 'System Design', 'Caching', 'PostgreSQL'],
        preferred_skills: ['PgBouncer', 'Terraform', 'AWS'],
        location: 'Remote',
        employment_type: 'Full-time',
        status: 'Active',
        created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: job3Id,
        title: 'Senior Frontend Architect',
        description: 'Architect modern Web application interfaces, high-performance UI state engines, and real-time streaming components.',
        department: 'Engineering',
        experience_level: 'Senior',
        required_skills: ['React', 'TypeScript', 'WebSockets', 'Performance Optimization'],
        preferred_skills: ['WebRTC', 'TailwindCSS', 'Vite'],
        location: 'New York, NY / Hybrid',
        employment_type: 'Full-time',
        status: 'Active',
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ],
    candidates: [
      {
        id: cand1Id,
        name: 'Alexander Wright',
        email: 'alex.wright@infra.io',
        phone: '+1 (555) 234-5678',
        role: 'Senior Distributed Systems Engineer',
        interview_id: int1Id,
        status: 'Completed',
        overall_score: 88,
        completion_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        avatar_initials: 'AW',
        skills: [
          { name: 'Distributed Systems', score: 92 },
          { name: 'System Architecture', score: 88 },
          { name: 'Problem Solving', score: 86 },
          { name: 'Communication', score: 85 }
        ],
        education: [
          { degree: 'B.S. in Computer Science', institution: 'University of California, Berkeley', year: '2018' }
        ],
        experience: [
          { title: 'Senior Infrastructure Engineer', company: 'CloudScale Networks', duration: '2021 - Present' },
          { title: 'Systems Engineer', company: 'CoreData Labs', duration: '2018 - 2021' }
        ],
        projects: [
          { name: 'Distributed Log Consensus Engine', description: 'Built an open-source Raft implementation handling 100k writes/sec' }
        ],
        recommendation: 'STRONG HIRE',
        summary: 'Exceptional candidate with deep mastery of distributed consensus, Raft protocol invariants, and network partitioning resilience.',
        strengths: [
          'Exhaustive understanding of leader election and log compaction algorithms.',
          'Pragmatic approach to payment idempotency with Redis keys and outbox pattern.',
          'Crisp, articulate technical verbal explanations.'
        ],
        weaknesses: [
          'Could expand on zero-downtime schema evolution strategies under high load.'
        ],
        timeline: [
          { questionId: q1Id, score: 92, timeTaken: 75, comments: 'Clear, accurate breakdown of Raft election timers and heartbeats.' },
          { questionId: q2Id, score: 84, timeTaken: 90, comments: 'Solid transactional outbox explanation with deduplication guarantees.' }
        ],
        profile_image_url: null,
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: cand2Id,
        name: 'Sarah Jenkins',
        email: 'sarah.j@frontend.dev',
        phone: '+1 (555) 876-5432',
        role: 'Senior Frontend Architect',
        interview_id: int3Id,
        status: 'Completed',
        overall_score: 92,
        completion_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        avatar_initials: 'SJ',
        skills: [
          { name: 'React Internals', score: 95 },
          { name: 'State Architecture', score: 92 },
          { name: 'Web Performance', score: 90 },
          { name: 'Communication', score: 91 }
        ],
        education: [
          { degree: 'M.S. in Software Systems', institution: 'Georgia Tech', year: '2019' }
        ],
        experience: [
          { title: 'Lead Frontend Engineer', company: 'Apex Interactive', duration: '2020 - Present' }
        ],
        projects: [
          { name: 'Fluid Streaming UI Canvas', description: 'Real-time multi-track audio-visualizer built on WebGL and AudioContext' }
        ],
        recommendation: 'STRONG HIRE',
        summary: 'Outstanding architectural mastery across modern component lifecycles, memory leak isolation, and WebRTC streaming.',
        strengths: [
          'Mastery over browser rendering pipelines, reflow triggers, and micro-optimizations.',
          'Demonstrated clean, well-tested code implementation in the IDE sandbox.'
        ],
        weaknesses: [
          'Minimal reservations; excellent candidate.'
        ],
        timeline: [],
        profile_image_url: null,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: cand3Id,
        name: 'Marcus Vance',
        email: 'm.vance@systems.io',
        phone: '+1 (555) 456-7890',
        role: 'Principal Cloud Systems Engineer',
        interview_id: int2Id,
        status: 'Invited',
        overall_score: null,
        completion_date: null,
        avatar_initials: 'MV',
        skills: [
          { name: 'System Design', score: 85 },
          { name: 'Cloud Topology', score: 82 }
        ],
        education: [],
        experience: [],
        projects: [],
        recommendation: null,
        summary: 'Scheduled for real-time live AI conversational interview.',
        strengths: [],
        weaknesses: [],
        timeline: [],
        profile_image_url: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: cand4Id,
        name: 'Priya Sharma',
        email: 'priya.sharma@cloudtech.com',
        phone: '+1 (555) 345-6789',
        role: 'Senior Distributed Systems Engineer',
        interview_id: int1Id,
        status: 'Invited',
        overall_score: null,
        completion_date: null,
        avatar_initials: 'PS',
        skills: [
          { name: 'Microservices', score: 80 },
          { name: 'Kafka', score: 78 }
        ],
        education: [],
        experience: [],
        projects: [],
        recommendation: null,
        summary: 'Candidate invited to async technical assessment.',
        strengths: [],
        weaknesses: [],
        timeline: [],
        profile_image_url: null,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ],
    interviews: [
      {
        id: int1Id,
        title: 'Senior Distributed Systems Engineer (Async)',
        job_role: 'Senior Distributed Systems Engineer',
        job_id: job1Id,
        company: 'InterviewX Technologies',
        candidate_id: cand1Id,
        type: 'async',
        status: 'Active',
        duration: 45,
        settings: {
          assessmentType: 'Hybrid (Coding + Audio)',
          proctoringEnabled: true,
          fullScreenEnforced: true,
          tabSwitchLimit: 3
        },
        started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 2 + 2700000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: int2Id,
        title: 'Principal Cloud Systems Live Interview',
        job_role: 'Principal Cloud Systems Engineer',
        job_id: job2Id,
        company: 'InterviewX Technologies',
        candidate_id: cand3Id,
        type: 'live',
        status: 'Active',
        duration: 30,
        settings: {
          assessmentType: 'Live AI Conversational',
          interviewerVoice: 'kavya',
          aiPersona: 'Ava',
          adaptiveFollowups: true
        },
        started_at: null,
        completed_at: null,
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: int3Id,
        title: 'Senior Frontend Architect Assessment',
        job_role: 'Senior Frontend Architect',
        job_id: job3Id,
        company: 'InterviewX Technologies',
        candidate_id: cand2Id,
        type: 'async',
        status: 'Active',
        duration: 40,
        settings: {
          assessmentType: 'Coding & Architecture',
          proctoringEnabled: true
        },
        started_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 1 + 2400000).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ],
    questions: [
      {
        id: q1Id,
        interview_id: int1Id,
        text: 'Explain how the Raft consensus algorithm handles leader election and log replication during network partitions.',
        question: 'Explain how the Raft consensus algorithm handles leader election and log replication during network partitions.',
        category: 'Distributed Systems',
        type: 'verbal',
        question_type: 'verbal',
        difficulty: 'Hard',
        order_index: 0,
        time_limit: 180,
        description: 'Focus on randomized election timeouts, majority quorums, split brain avoidance, and uncommitted log entry truncations.',
        criteria: 'Evaluates deep understanding of distributed consensus mechanics.',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        id: q2Id,
        interview_id: int1Id,
        text: 'How do you design an idempotent payment processing pipeline with at-least-once message delivery?',
        question: 'How do you design an idempotent payment processing pipeline with at-least-once message delivery?',
        category: 'System Architecture',
        type: 'verbal',
        question_type: 'verbal',
        difficulty: 'Hard',
        order_index: 1,
        time_limit: 180,
        description: 'Discuss idempotency keys, database unique constraint locking, caching with TTL, and outbox transactional event patterns.',
        criteria: 'Evaluates resilience patterns for critical financial transactions.',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        id: q3Id,
        interview_id: int1Id,
        text: 'Implement a thread-safe LRU Cache with O(1) get and put time complexity.',
        question: 'Implement a thread-safe LRU Cache with O(1) get and put time complexity.',
        category: 'Coding',
        type: 'code',
        question_type: 'code',
        difficulty: 'Medium',
        order_index: 2,
        time_limit: 300,
        description: 'Write a JavaScript class or function that maintains an LRU eviction policy using a Hash Map and Doubly Linked List.',
        boilerplate: `function createLRUCache(capacity) {\n  const map = new Map();\n  return {\n    get: function(key) {\n      if (!map.has(key)) return -1;\n      const val = map.get(key);\n      map.delete(key);\n      map.set(key, val);\n      return val;\n    },\n    put: function(key, val) {\n      if (map.has(key)) map.delete(key);\n      map.set(key, val);\n      if (map.size > capacity) {\n        const oldest = map.keys().next().value;\n        map.delete(oldest);\n      }\n    }\n  };\n}`,
        test_cases: [
          { input: '{"capacity": 2, "ops": [["put", 1, 1], ["put", 2, 2], ["get", 1]]}', expected: '1' }
        ],
        criteria: 'Evaluates clean data structure design and execution.',
        created_at: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        id: q4Id,
        interview_id: int2Id,
        text: 'How do you structure microservices with low-latency caching and handle database connection pool saturation?',
        question: 'How do you structure microservices with low-latency caching and handle database connection pool saturation?',
        category: 'System Design',
        type: 'verbal',
        question_type: 'verbal',
        difficulty: 'Hard',
        order_index: 0,
        time_limit: 180,
        description: 'Address read-through caching with Redis clusters, stampede prevention via distributed locks, and connection poolers like PgBouncer.',
        criteria: 'Assesses high-scale cloud database design.',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: q5Id,
        interview_id: int2Id,
        text: 'Explain concurrency controls and idempotency in distributed transaction systems.',
        question: 'Explain concurrency controls and idempotency in distributed transaction systems.',
        category: 'Backend Engineering',
        type: 'verbal',
        question_type: 'verbal',
        difficulty: 'Hard',
        order_index: 1,
        time_limit: 180,
        description: 'Contrast optimistic locking (version numbers) with pessimistic locking, and detail 2-Phase Commit vs Saga patterns.',
        criteria: 'Assesses transactional consistency in distributed environments.',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ],
    answers: [
      {
        id: generateUUID(),
        interview_id: int1Id,
        candidate_id: cand1Id,
        question_id: q1Id,
        transcript: 'Raft uses randomized election timers to avoid split votes. When a follower does not hear heartbeats, it transitions to candidate, increments term, votes for itself, and requests votes from peers.',
        answer_text: 'Raft uses randomized election timers to avoid split votes. When a follower does not hear heartbeats, it transitions to candidate, increments term, votes for itself, and requests votes from peers.',
        time_taken: 75,
        score: 92,
        feedback: 'Accurately covered term incrementing and peer quorum votes.',
        submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: generateUUID(),
        interview_id: int1Id,
        candidate_id: cand1Id,
        question_id: q2Id,
        transcript: 'We assign unique idempotency keys to each transaction, store processed keys in Redis with TTL and PostgreSQL unique constraints, and employ transactional outbox with Kafka.',
        answer_text: 'We assign unique idempotency keys to each transaction, store processed keys in Redis with TTL and PostgreSQL unique constraints, and employ transactional outbox with Kafka.',
        time_taken: 90,
        score: 84,
        feedback: 'Well-structured design preventing duplicate charges.',
        submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    reports: [
      {
        id: generateUUID(),
        interview_id: int1Id,
        candidate_id: cand1Id,
        overall_score: 88,
        technical_score: 90,
        communication_score: 85,
        problem_solving_score: 88,
        recommendation: 'STRONG HIRE',
        summary: 'Alexander demonstrated mastery of distributed consensus, state machine replication, and idempotent processing architectures.',
        strengths: [
          'Thorough explanation of Raft leader election invariants.',
          'Pragmatic deduplication with Redis and database unique constraints.',
          'Calm, highly structured communication.'
        ],
        weaknesses: [
          'Could elaborate on multi-datacenter cross-region consensus latency.'
        ],
        competency_scores: {
          'Distributed Systems': 92,
          'System Architecture': 88,
          'Problem Solving': 86,
          'Communication': 85
        },
        question_breakdown: [
          { questionText: 'Explain how the Raft consensus algorithm handles leader election...', score: 92, feedback: 'Strong explanation.' },
          { questionText: 'How do you design an idempotent payment processing pipeline...', score: 84, feedback: 'Good handling of idempotency keys.' }
        ],
        proctoring_summary: {
          tabHiddenCount: 0,
          tabVisibleCount: 1,
          fullscreenEnteredCount: 1,
          fullscreenExitedCount: 0,
          violationCount: 0,
          integrityScore: 100,
          suspicionLevel: 'LOW'
        },
        proctoring_logs: [],
        candidate_meta: {
          name: 'Alexander Wright',
          email: 'alex.wright@infra.io',
          role: 'Senior Distributed Systems Engineer'
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ],
    resumes: [],
    proctoring_observations: []
  };
};

class LocalDatabaseStore {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required tables exist
        const defaultData = getDefaultSeedData();
        for (const key of Object.keys(defaultData)) {
          if (!Array.isArray(parsed[key])) {
            parsed[key] = defaultData[key];
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn('[LocalDatabaseStore] Notice reading existing DB file, re-seeding:', err.message);
    }
    const seed = getDefaultSeedData();
    this.saveData(seed);
    return seed;
  }

  saveData(dataToSave = null) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[LocalDatabaseStore] Error persisting DB file:', err.message);
    }
  }

  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  from(tableName) {
    return new PostgrestQueryBuilder(this, tableName);
  }

  get storage() {
    return new LocalStorageManager();
  }
}

/**
 * Emulates the Supabase PostgREST Query Builder
 */
class PostgrestQueryBuilder {
  constructor(store, tableName) {
    this.store = store;
    this.tableName = tableName;
    this.operation = 'SELECT'; // SELECT | INSERT | UPDATE | UPSERT | DELETE
    this.selectColumns = '*';
    this.selectOptions = {};
    this.filters = [];
    this.orders = [];
    this.limitCount = null;
    this.rangeOffsets = null;
    this.payload = null;
    this.upsertOptions = {};
    this.isSingle = false;
    this.isMaybeSingle = false;
  }

  select(columns = '*', options = {}) {
    this.selectColumns = columns;
    this.selectOptions = options;
    if (this.operation !== 'INSERT' && this.operation !== 'UPDATE' && this.operation !== 'UPSERT') {
      this.operation = 'SELECT';
    }
    return this;
  }

  insert(data) {
    this.operation = 'INSERT';
    this.payload = data;
    return this;
  }

  update(data) {
    this.operation = 'UPDATE';
    this.payload = data;
    return this;
  }

  upsert(data, options = {}) {
    this.operation = 'UPSERT';
    this.payload = data;
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.operation = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ type: 'in', column, value: Array.isArray(values) ? values : [values] });
    return this;
  }

  is(column, value) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  range(from, to) {
    this.rangeOffsets = { from, to };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  /**
   * Evaluates query filters against a row
   */
  matchesFilters(row) {
    for (const f of this.filters) {
      const val = row[f.column];
      if (f.type === 'eq') {
        if (String(val) !== String(f.value)) return false;
      } else if (f.type === 'neq') {
        if (String(val) === String(f.value)) return false;
      } else if (f.type === 'in') {
        const strValues = f.value.map(v => String(v));
        if (!strValues.includes(String(val))) return false;
      } else if (f.type === 'is') {
        if (f.value === null && val !== null && val !== undefined) return false;
        if (f.value !== null && val !== f.value) return false;
      }
    }
    return true;
  }

  /**
   * Hydrates joined relations like *, resumes(*) or *, candidate:candidates(*)
   */
  hydrateRow(row) {
    if (!this.selectColumns || this.selectColumns === '*') return { ...row };

    const cloned = { ...row };

    // Relation: resumes(*)
    if (this.selectColumns.includes('resumes(*)')) {
      const allResumes = this.store.getTable('resumes');
      const matched = allResumes.find(r => r.candidate_id === row.id);
      cloned.resumes = matched ? { ...matched } : null;
    }

    // Relation: candidate:candidates(*)
    if (this.selectColumns.includes('candidate:candidates(*)') || this.selectColumns.includes('candidate:candidates')) {
      const allCandidates = this.store.getTable('candidates');
      const matched = allCandidates.find(c => c.id === row.candidate_id);
      cloned.candidate = matched ? { ...matched } : null;
    }

    // Relation: questions(*)
    if (this.selectColumns.includes('questions(*)')) {
      const allQuestions = this.store.getTable('questions');
      const matched = allQuestions.filter(q => q.interview_id === row.id);
      cloned.questions = matched.map(q => ({ ...q }));
    }

    return cloned;
  }

  async execute() {
    const table = this.store.getTable(this.tableName);

    // 1. SELECT
    if (this.operation === 'SELECT') {
      let results = table.filter(row => this.matchesFilters(row));

      // Order
      for (const ord of this.orders) {
        results.sort((a, b) => {
          const valA = a[ord.column] ?? '';
          const valB = b[ord.column] ?? '';
          if (valA < valB) return ord.ascending ? -1 : 1;
          if (valA > valB) return ord.ascending ? 1 : -1;
          return 0;
        });
      }

      const totalCount = results.length;

      // Range & Limit
      if (this.rangeOffsets) {
        results = results.slice(this.rangeOffsets.from, this.rangeOffsets.to + 1);
      } else if (this.limitCount !== null) {
        results = results.slice(0, this.limitCount);
      }

      // Hydrate relations
      const hydrated = results.map(row => this.hydrateRow(row));

      if (this.isSingle) {
        if (hydrated.length === 0) {
          return { data: null, error: { message: `Row not found in ${this.tableName}`, code: 'PGRST116' }, count: null };
        }
        return { data: hydrated[0], error: null, count: totalCount };
      }

      if (this.isMaybeSingle) {
        return { data: hydrated.length > 0 ? hydrated[0] : null, error: null, count: totalCount };
      }

      return {
        data: hydrated,
        error: null,
        count: this.selectOptions.count === 'exact' ? totalCount : null
      };
    }

    // 2. INSERT
    if (this.operation === 'INSERT') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const insertedRows = [];

      for (const item of items) {
        const newRow = {
          id: item.id || generateUUID(),
          ...item,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        table.push(newRow);
        insertedRows.push(newRow);
      }

      this.store.saveData();

      const hydrated = insertedRows.map(r => this.hydrateRow(r));
      if (this.isSingle || (!Array.isArray(this.payload) && !this.selectColumns.includes('*'))) {
        return { data: hydrated[0], error: null };
      }
      return { data: Array.isArray(this.payload) ? hydrated : hydrated[0], error: null };
    }

    // 3. UPDATE
    if (this.operation === 'UPDATE') {
      const updatedRows = [];
      for (let i = 0; i < table.length; i++) {
        if (this.matchesFilters(table[i])) {
          table[i] = {
            ...table[i],
            ...this.payload,
            updated_at: new Date().toISOString()
          };
          updatedRows.push(table[i]);
        }
      }

      this.store.saveData();

      const hydrated = updatedRows.map(r => this.hydrateRow(r));
      if (this.isSingle) {
        return { data: hydrated[0] || null, error: hydrated.length === 0 ? { message: 'Row not found for update' } : null };
      }
      return { data: hydrated, error: null };
    }

    // 4. UPSERT
    if (this.operation === 'UPSERT') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const onConflict = this.upsertOptions.onConflict || 'id';
      const conflictKeys = onConflict.split(',').map(s => s.trim());
      const upsertedRows = [];

      for (const item of items) {
        const existingIdx = table.findIndex(row => {
          return conflictKeys.every(k => item[k] !== undefined && String(row[k]) === String(item[k]));
        });

        if (existingIdx !== -1) {
          table[existingIdx] = {
            ...table[existingIdx],
            ...item,
            updated_at: new Date().toISOString()
          };
          upsertedRows.push(table[existingIdx]);
        } else {
          const newRow = {
            id: item.id || generateUUID(),
            ...item,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          table.push(newRow);
          upsertedRows.push(newRow);
        }
      }

      this.store.saveData();

      const hydrated = upsertedRows.map(r => this.hydrateRow(r));
      if (this.isSingle || !Array.isArray(this.payload)) {
        return { data: hydrated[0], error: null };
      }
      return { data: hydrated, error: null };
    }

    // 5. DELETE
    if (this.operation === 'DELETE') {
      const remaining = [];
      const deleted = [];

      for (const row of table) {
        if (this.matchesFilters(row)) {
          deleted.push(row);
        } else {
          remaining.push(row);
        }
      }

      this.store.data[this.tableName] = remaining;
      this.store.saveData();

      return { data: deleted, error: null };
    }

    return { data: null, error: null };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

/**
 * Emulates Supabase Storage Engine locally
 */
class LocalStorageManager {
  constructor() {
    this.buckets = new Set(['resumes', 'interview-recordings']);
  }

  async listBuckets() {
    return {
      data: Array.from(this.buckets).map(name => ({ id: name, name, public: true })),
      error: null
    };
  }

  async createBucket(name, options = {}) {
    this.buckets.add(name);
    const bucketDir = path.join(UPLOADS_DIR, name);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }
    return { data: { name }, error: null };
  }

  from(bucketName) {
    const bucketDir = path.join(UPLOADS_DIR, bucketName);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    return {
      upload: async (filePath, fileBody, options = {}) => {
        try {
          const fullPath = path.join(bucketDir, filePath);
          const dir = path.dirname(fullPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          let buffer;
          if (Buffer.isBuffer(fileBody)) {
            buffer = fileBody;
          } else if (fileBody instanceof ArrayBuffer) {
            buffer = Buffer.from(fileBody);
          } else if (typeof fileBody?.arrayBuffer === 'function') {
            const ab = await fileBody.arrayBuffer();
            buffer = Buffer.from(ab);
          } else if (typeof fileBody === 'string') {
            buffer = Buffer.from(fileBody, 'utf-8');
          } else {
            buffer = Buffer.from(String(fileBody));
          }

          fs.writeFileSync(fullPath, buffer);
          return { data: { path: filePath }, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },

      getPublicUrl: (filePath) => {
        // Standardized static file endpoint served by Express app.use('/uploads', express.static('uploads'))
        const cleanPath = filePath.replace(/\\/g, '/');
        const port = process.env.PORT || 5000;
        return {
          data: {
            publicUrl: `http://localhost:${port}/uploads/${bucketName}/${cleanPath}`
          }
        };
      },

      download: async (filePath) => {
        try {
          const fullPath = path.join(bucketDir, filePath);
          if (!fs.existsSync(fullPath)) {
            return { data: null, error: { message: 'File not found on local storage' } };
          }
          const buf = fs.readFileSync(fullPath);
          return { data: new Blob([buf]), error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      },

      remove: async (paths = []) => {
        try {
          for (const p of paths) {
            const fullPath = path.join(bucketDir, p);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
          return { data: paths, error: null };
        } catch (err) {
          return { data: null, error: { message: err.message } };
        }
      }
    };
  }
}

export const localDatabaseStore = new LocalDatabaseStore();
export default localDatabaseStore;
