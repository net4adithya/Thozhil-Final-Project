import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Play,
  Code2,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
  BookOpen,
  Trash2,
  Copy,
  Search,
  Filter,
  ArrowRight,
  Lightbulb,
  Terminal,
  HelpCircle,
  FileCode,
  ShieldCheck,
  RotateCcw,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { interviewService } from '../services/interviewService';

// Standard industry assessment templates
export const READYMADE_TEMPLATES = [
  {
    id: 'tpl-frontend-react-debounce',
    title: 'Frontend React: Debounced Auto-Suggest & Cache',
    track: 'Frontend',
    difficulty: 'Intermediate',
    duration: 30,
    tags: ['React', 'Hooks', 'Async', 'Performance'],
    description: 'Implement an optimal debounced autocomplete hook that handles in-flight race conditions, caches previous responses, and cleans up timers on unmount.',
    problemStatement: `### Objective
Build a robust, memory-safe debounce hook and query executor for a high-frequency search input.

#### Requirements:
1. \`useDebounce(value, delayMs)\`: Return debounced value only after \`delayMs\` of inactivity.
2. Race Condition Isolation: In-flight HTTP promises from stale queries must be discarded when a newer query is initiated.
3. In-memory LRU Cache: Repeat searches within the session should return cached data instantly with 0ms latency.
4. Memory Leak Mitigation: All active \`setTimeout\` handlers must cancel on component unmount.`,
    starterCode: `/**
 * Problem: Debounced Search & Cache Utility
 * Implement your solution below.
 */

export function debounce(fn, delayMs = 300) {
  let timerId = null;

  return function (...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delayMs);
  };
}

export class QueryCache {
  constructor(maxEntries = 50) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    // Refresh recency
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}
`,
    testCases: [
      { input: 'debounce(fn, 100) with 3 rapid triggers', expected: 'Triggered exactly 1 time', note: 'Rapid invocations coalesce' },
      { input: 'QueryCache.set("react", data); QueryCache.get("react")', expected: 'Cached data returned instantly', note: 'Cache hits' },
      { input: 'QueryCache max capacity eviction (size: 2)', expected: 'Oldest entry evicted', note: 'LRU bounds check' }
    ],
    hints: [
      'Level 1: Remember to clear any pending timeout in the outer closure before initiating a new one.',
      'Level 2: For the cache, JavaScript Map preserves insertion order, which simplifies LRU eviction.',
      'Level 3: Ensure your debounce function passes arguments and execution context correctly using .apply(this, args).'
    ]
  },
  {
    id: 'tpl-dsa-two-sum',
    title: 'Algorithms: Optimal Two-Sum & Hash Mapping',
    track: 'Algorithms',
    difficulty: 'Beginner',
    duration: 25,
    tags: ['Data Structures', 'Hash Table', 'Big-O', 'Arrays'],
    description: 'Given an array of integers and an integer target, return indices of the two numbers such that they add up to the target in linear O(n) time.',
    problemStatement: `### Problem Statement
Given an integer array \`nums\` and an integer \`target\`, find two numbers such that they add up to \`target\` and return their indices in an array: \`[index1, index2]\`.

#### Constraints:
- Exactly one valid solution exists.
- You may not use the same element twice.
- Target runtime: **O(n) time complexity** and **O(n) space complexity**.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
export function twoSum(nums, target) {
  const map = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }

  return [];
}
`,
    testCases: [
      { input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]', note: 'Standard pair at beginning' },
      { input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]', note: 'Non-zero index complement' },
      { input: 'nums = [3, 3], target = 6', expected: '[0, 1]', note: 'Duplicate values handled properly' }
    ],
    hints: [
      'Level 1: Avoid nested loops (O(n²)). How can a hash map help you check for the complement in O(1)?',
      'Level 2: Compute complement = target - nums[i] on each iteration and check if it already exists in the map.',
      'Level 3: Store the number as the map key and its index as the value: map.set(nums[i], i).'
    ]
  },
  {
    id: 'tpl-backend-rate-limiter',
    title: 'Backend Systems: Token Bucket Rate Limiter',
    track: 'Backend',
    difficulty: 'Senior',
    duration: 45,
    tags: ['Node.js', 'Distributed Systems', 'Concurrency', 'Algorithms'],
    description: 'Design and implement an in-memory Token Bucket rate limiter to throttle API requests per client IP with burst capacity and time-based refill.',
    problemStatement: `### System Specification
Implement a production-grade Token Bucket algorithm to protect upstream API handlers from high-frequency bursts while accommodating legitimate spike traffic.

#### Rules:
1. Bucket capacity: \`maxTokens\` (e.g. 10 tokens).
2. Refill rate: \`refillRatePerSec\` tokens added per second up to \`maxTokens\`.
3. \`allowRequest(clientId, tokensRequested = 1)\`: Returns \`true\` if tokens are available, deducting them; otherwise returns \`false\`.
4. Graceful Time Synchronization: Fractional tokens should refill accurately based on elapsed milliseconds.`,
    starterCode: `export class TokenBucketRateLimiter {
  constructor(capacity = 10, refillRatePerSec = 2) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    this.clients = new Map();
  }

  allowRequest(clientId, tokens = 1) {
    const now = Date.now();
    let record = this.clients.get(clientId);

    if (!record) {
      record = { tokens: this.capacity, lastRefill: now };
      this.clients.set(clientId, record);
    }

    // Calculate token refill based on elapsed time
    const elapsedSec = (now - record.lastRefill) / 1000;
    record.tokens = Math.min(this.capacity, record.tokens + elapsedSec * this.refillRatePerSec);
    record.lastRefill = now;

    if (record.tokens >= tokens) {
      record.tokens -= tokens;
      return true;
    }

    return false;
  }
}
`,
    testCases: [
      { input: 'Initial 5 burst requests with capacity 10', expected: 'All 5 requests permitted (true)', note: 'Burst tolerance' },
      { input: '15 rapid requests exceeding capacity 10', expected: 'First 10 true, next 5 false', note: 'Rate limit enforced' },
      { input: 'Request after 1 second refill delay', expected: 'Refilled tokens permit new request (true)', note: 'Time-based refill' }
    ],
    hints: [
      'Level 1: Don’t run background setInterval timers per client—refill lazily upon each incoming request using Date.now().',
      'Level 2: Elapsed seconds = (now - lastRefill) / 1000. New tokens = min(capacity, currentTokens + elapsedSec * refillRate).',
      'Level 3: Ensure you update lastRefill to now and clamp the tokens to capacity.'
    ]
  },
  {
    id: 'tpl-dsa-lru-cache',
    title: 'DSA: Least Recently Used (LRU) Cache',
    track: 'Algorithms',
    difficulty: 'Senior',
    duration: 40,
    tags: ['Data Structures', 'Hash Map', 'Doubly Linked List', 'O(1)'],
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get and put operations.',
    problemStatement: `### Problem Statement
Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\`: Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\`: Return the value of the \`key\` if it exists, otherwise return \`-1\`.
- \`void put(int key, int value)\`: Update or insert the key-value pair. If the number of keys exceeds \`capacity\`, evict the least recently used key.

Both \`get\` and \`put\` must run in **O(1) average time complexity**.`,
    starterCode: `class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._insert(node);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      this._remove(this.map.get(key));
    }
    const newNode = new Node(key, value);
    this._insert(newNode);
    this.map.set(key, newNode);

    if (this.map.size > this.capacity) {
      const lru = this.head.next;
      this._remove(lru);
      this.map.delete(lru.key);
    }
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _insert(node) {
    node.prev = this.tail.prev;
    node.next = this.tail;
    this.tail.prev.next = node;
    this.tail.prev = node;
  }
}
`,
    testCases: [
      { input: 'put(1, 1), put(2, 2), get(1)', expected: 'Returns 1, moves key 1 to most recent', note: 'Recency update' },
      { input: 'put(3, 3) when capacity is 2', expected: 'Key 2 is evicted (LRU)', note: 'Eviction order' },
      { input: 'get(2) after eviction', expected: 'Returns -1', note: 'Evicted key lookup' }
    ],
    hints: [
      'Level 1: To achieve O(1) removals and insertions at any point, combine a Hash Map with a Doubly Linked List.',
      'Level 2: Use dummy head and tail nodes to avoid null-pointer checks during edge insertions and deletions.',
      'Level 3: On every get(key), don’t forget to move that node to the most recent position.'
    ]
  },
  {
    id: 'tpl-fullstack-circuit-breaker',
    title: 'Distributed Systems: Circuit Breaker State Machine',
    track: 'Distributed Systems',
    difficulty: 'Staff',
    duration: 45,
    tags: ['Reliability', 'State Machine', 'Microservices', 'Resilience'],
    description: 'Build a production-grade Circuit Breaker pattern with Closed, Open, and Half-Open states to prevent cascading downstream failures.',
    problemStatement: `### Problem Specification
Protect distributed microservices from cascading failures by halting outgoing RPCs when downstream error rates cross a defined threshold.

#### State Transitions:
1. **CLOSED**: Normal operation. Failures are tracked. If \`failureCount >= failureThreshold\`, trip to **OPEN**.
2. **OPEN**: All requests fail-fast immediately with \`CircuitBreakerOpenException\` without executing the network call. After \`recoveryTimeoutMs\`, transition to **HALF-OPEN**.
3. **HALF-OPEN**: Permit a single probe request. If successful, reset to **CLOSED**; if it fails, trip back to **OPEN**.`,
    starterCode: `export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 5000;
    this.state = 'CLOSED'; // CLOSED | OPEN | HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(action) {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker is OPEN: fast-failing call');
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeoutMs;
    }
  }
}
`,
    testCases: [
      { input: '3 consecutive failed RPC calls', expected: 'Circuit trips to OPEN state', note: 'Threshold trigger' },
      { input: 'Call during OPEN window', expected: 'Throws Circuit Breaker OPEN fast-fail', note: 'Protection window' },
      { input: 'Successful call after recovery timeout', expected: 'Circuit resets to CLOSED', note: 'Self-healing recovery' }
    ],
    hints: [
      'Level 1: Track the exact timestamp when the circuit tripped to determine when to probe in HALF-OPEN state.',
      'Level 2: In HALF-OPEN, any single failure immediately trips back to OPEN for another cooldown period.',
      'Level 3: On success in HALF-OPEN or CLOSED, reset failureCount back to 0.'
    ]
  }
];

// Quick presets for the Candidate Custom Question Creator
const QUICK_PRESETS = [
  {
    title: 'Deep Clone Object with Circular Reference Protection',
    track: 'Frontend',
    difficulty: 'Intermediate',
    duration: 25,
    description: 'Implement a deep clone algorithm in JavaScript that recursively duplicates objects, arrays, and dates while gracefully handling circular references.',
    starterCode: `export function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;
  if (target instanceof Date) return new Date(target);

  if (map.has(target)) return map.get(target);

  const clone = Array.isArray(target) ? [] : {};
  map.set(target, clone);

  for (const key of Object.keys(target)) {
    clone[key] = deepClone(target[key], map);
  }

  return clone;
}
`,
    testCases: [
      { input: '{ a: 1, b: { c: 2 } }', expected: 'Deep copied nested clone', note: 'Nested structure' },
      { input: 'obj.self = obj (Circular structure)', expected: 'Resolves without recursion overflow', note: 'WeakMap circular handling' }
    ]
  },
  {
    title: 'Promise.all Polyfill Implementation',
    track: 'Frontend',
    difficulty: 'Intermediate',
    duration: 30,
    description: 'Build a custom polyfill for Promise.all from scratch without using native Promise.all or Promise.allSettled.',
    starterCode: `export function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(promises)) {
      return reject(new TypeError('Argument must be an array'));
    }
    if (promises.length === 0) return resolve([]);

    const results = new Array(promises.length);
    let completedCount = 0;

    promises.forEach((p, index) => {
      Promise.resolve(p)
        .then((val) => {
          results[index] = val;
          completedCount++;
          if (completedCount === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);
    });
  });
}
`,
    testCases: [
      { input: '[Promise.resolve(1), Promise.resolve(2)]', expected: '[1, 2] in exact index order', note: 'Order preservation' },
      { input: '[Promise.resolve(1), Promise.reject("Error")]', expected: 'Fast-fails with "Error"', note: 'Rejection propagation' }
    ]
  },
  {
    title: 'Flatten Deeply Nested Array & Object',
    track: 'Algorithms',
    difficulty: 'Beginner',
    duration: 20,
    description: 'Implement an in-place or recursive array flatten algorithm up to depth n or infinite depth.',
    starterCode: `export function flatten(arr, depth = 1) {
  if (depth <= 0) return arr.slice();

  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}
`,
    testCases: [
      { input: '[1, [2, [3, [4]]]], depth = 1', expected: '[1, 2, [3, [4]]]', note: 'Depth 1 flatten' },
      { input: '[1, [2, [3, [4]]]], depth = Infinity', expected: '[1, 2, 3, 4]', note: 'Complete flatten' }
    ]
  }
];

export const CandidatePracticeSandbox = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [isAppointed, setIsAppointed] = useState(true);

  useEffect(() => {
    async function verifyInterviewAppointment() {
      try {
        const storedCandId = typeof window !== 'undefined' ? sessionStorage.getItem('interviewx_active_candidate_id') : null;
        if (storedCandId) {
          const list = await interviewService.getInterviews({ candidateId: storedCandId });
          if (!list || list.length === 0) {
            setIsAppointed(false);
          }
        }
      } catch (_) {}
    }
    verifyInterviewAppointment();
  }, []);

  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'create' | 'saved'
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Candidate custom questions stored in localStorage
  const [savedQuestions, setSavedQuestions] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewx_custom_practice_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom Question Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customTrack, setCustomTrack] = useState('Frontend');
  const [customDifficulty, setCustomDifficulty] = useState('Intermediate');
  const [customDuration, setCustomDuration] = useState(30);
  const [customDescription, setCustomDescription] = useState('');
  const [customStarterCode, setCustomStarterCode] = useState(`/**
 * Candidate Custom Practice Challenge
 * Define your solution below.
 */

export function solve(input) {
  // Your code here
  return input;
}
`);
  const [customTestCases, setCustomTestCases] = useState([
    { input: 'solve("example")', expected: '"example"', note: 'Basic identity check' }
  ]);
  const [customHints, setCustomHints] = useState([
    'Level 1: Consider edge cases like empty inputs or null references.',
    'Level 2: Think about optimal time and space complexity targets.'
  ]);

  // Persist custom questions
  useEffect(() => {
    try {
      localStorage.setItem('interviewx_custom_practice_questions', JSON.stringify(savedQuestions));
    } catch (err) {
      console.warn('Failed to persist custom questions:', err);
    }
  }, [savedQuestions]);

  // Filter templates
  const filteredTemplates = READYMADE_TEMPLATES.filter((tpl) => {
    const matchesTrack = selectedTrack === 'ALL' || tpl.track.toUpperCase() === selectedTrack.toUpperCase();
    const matchesSearch = tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTrack && matchesSearch;
  });

  // Launch into practice room
  const handleLaunchTemplate = (template) => {
    // Store active practice challenge in sessionStorage for room access
    try {
      sessionStorage.setItem('interviewx_active_practice_challenge', JSON.stringify(template));
    } catch {}
    navigate('/candidate/practice/room');
  };

  // Add test case row in creator
  const handleAddTestCase = () => {
    setCustomTestCases((prev) => [...prev, { input: '', expected: '', note: '' }]);
  };

  const handleRemoveTestCase = (idx) => {
    setCustomTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateTestCase = (idx, field, val) => {
    setCustomTestCases((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Save custom question to presets
  const handleSaveCustomQuestion = (andLaunch = false) => {
    if (!customTitle.trim()) {
      showToast('Please provide a challenge title.', 'warning');
      return;
    }

    const newQuestion = {
      id: `custom-q-${Date.now()}`,
      title: customTitle,
      track: customTrack,
      difficulty: customDifficulty,
      duration: Number(customDuration) || 30,
      description: customDescription || 'Custom candidate practice problem.',
      problemStatement: customDescription,
      starterCode: customStarterCode,
      testCases: customTestCases.filter((tc) => tc.input && tc.expected),
      hints: customHints.filter(Boolean),
      tags: ['Custom', customTrack, customDifficulty],
      createdAt: new Date().toISOString()
    };

    setSavedQuestions((prev) => [newQuestion, ...prev]);
    showToast(`Saved "${customTitle}" to custom questions.`, 'success');

    if (andLaunch) {
      handleLaunchTemplate(newQuestion);
    } else {
      setActiveTab('saved');
    }
  };

  // Apply Quick Preset
  const handleApplyQuickPreset = (preset) => {
    setCustomTitle(preset.title);
    setCustomTrack(preset.track);
    setCustomDifficulty(preset.difficulty);
    setCustomDuration(preset.duration);
    setCustomDescription(preset.description);
    setCustomStarterCode(preset.starterCode);
    setCustomTestCases(preset.testCases || []);
    showToast(`Loaded preset: "${preset.title}"`, 'primary');
  };

  // Delete saved question
  const handleDeleteSavedQuestion = (id) => {
    setSavedQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast('Deleted practice question.', 'primary');
  };

  if (!isAppointed) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center font-sans py-20">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-3 py-0.5 rounded-full">
              Manager Appointment Required
            </span>
            <h1 className="text-xl font-bold text-slate-900 pt-2">
              Practice Sandbox Restricted
            </h1>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Candidate practice challenges and live test rooms are only accessible once a hiring manager or interviewer appoints a video interview session for your profile. Please check back after your interview has been scheduled.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/candidate')}
              variant="primary"
              className="w-full justify-center"
            >
              Return to Candidate Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex-grow flex flex-col max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 text-left font-sans text-slate-900 pb-16">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Interactive Practice Sandbox</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">100% Private & Ungraded</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Candidate Practice Sandbox
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Calibrate your coding speed, articulate your thought process out loud, and execute test cases before your official assessment. Choose an industry-standard template or author your own custom challenge.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button
              onClick={() => setActiveTab('create')}
              variant={activeTab === 'create' ? 'primary' : 'secondary'}
              size="sm"
              icon={Plus}
            >
              Create Question
            </Button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-100 pt-4 overflow-x-auto">
          {[
            { id: 'templates', label: `Ready-made Templates (${READYMADE_TEMPLATES.length})`, icon: BookOpen },
            { id: 'create', label: 'Create Custom Question', icon: Plus },
            { id: 'saved', label: `My Custom Questions (${savedQuestions.length})`, icon: Code2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: READY-MADE ASSESSMENT TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Search & Track Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'Frontend', 'Backend', 'Algorithms', 'Distributed Systems'].map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedTrack === track
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, tags, algorithms..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-shadow shadow-xs flex flex-col justify-between space-y-4 text-left group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                      {template.track}
                    </span>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{template.duration}m</span>
                      </span>
                      <span>•</span>
                      <span className={
                        template.difficulty === 'Senior' || template.difficulty === 'Staff'
                          ? 'text-purple-700 font-bold'
                          : template.difficulty === 'Intermediate'
                          ? 'text-blue-700 font-semibold'
                          : 'text-emerald-700 font-semibold'
                      }>
                        {template.difficulty}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {template.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {template.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center space-x-1"
                  >
                    <span>View Problem Spec</span>
                  </button>

                  <Button
                    onClick={() => handleLaunchTemplate(template)}
                    variant="primary"
                    size="sm"
                    icon={Play}
                    iconPosition="left"
                  >
                    Launch in Sandbox
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATE CREATE CUSTOM QUESTION */}
      {activeTab === 'create' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Author Custom Practice Challenge</h2>
            <p className="text-xs text-slate-500">
              Create a custom problem statement, starter code, and test cases to practice exactly what you want.
            </p>
          </div>

          {/* Quick-Add Presets Chips */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick-Add Popular Interview Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleApplyQuickPreset(p)}
                  className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-xs text-slate-700 rounded-lg transition-colors font-medium text-left"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Question Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Question Title *</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Implement Deep Clone Function"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Category / Track</label>
                <select
                  value={customTrack}
                  onChange={(e) => setCustomTrack(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Frontend">Frontend / React</option>
                  <option value="Backend">Backend / Node.js</option>
                  <option value="Algorithms">Algorithms / DSA</option>
                  <option value="Distributed Systems">Distributed Systems</option>
                  <option value="General">General Technical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Difficulty</label>
                <select
                  value={customDifficulty}
                  onChange={(e) => setCustomDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Beginner">Beginner / Junior</option>
                  <option value="Intermediate">Intermediate / Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Staff">Staff / Architect</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Recommended Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Problem Description */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Problem Statement & Requirements</label>
              <textarea
                rows={4}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe the task, edge case requirements, inputs, outputs, and constraints..."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 leading-relaxed font-sans"
              />
            </div>

            {/* Starter Code Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Starter Code Boilerplate</label>
                <span className="text-[10px] text-slate-400 font-mono">JavaScript (ES6+)</span>
              </div>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <textarea
                  rows={8}
                  value={customStarterCode}
                  onChange={(e) => setCustomStarterCode(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 focus:outline-none leading-relaxed resize-y"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Test Cases Builder */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Automated Sandbox Test Cases</label>
                <button
                  type="button"
                  onClick={handleAddTestCase}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Test Case</span>
                </button>
              </div>

              <div className="space-y-2">
                {customTestCases.map((tc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Case {idx + 1}
                      </span>
                      {customTestCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="text-slate-400 hover:text-red-600 text-xs p-1"
                          title="Remove test case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => handleUpdateTestCase(idx, 'input', e.target.value)}
                        placeholder="Input invocation, e.g. solve(10)"
                        className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                      <input
                        type="text"
                        value={tc.expected}
                        onChange={(e) => handleUpdateTestCase(idx, 'expected', e.target.value)}
                        placeholder="Expected return, e.g. 10"
                        className="bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                onClick={() => handleSaveCustomQuestion(false)}
                variant="secondary"
                size="sm"
              >
                Save to My Presets
              </Button>

              <Button
                type="button"
                onClick={() => handleSaveCustomQuestion(true)}
                variant="primary"
                size="sm"
                icon={Play}
                iconPosition="right"
              >
                Save & Launch in Sandbox
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MY SAVED CUSTOM QUESTIONS */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">My Custom Questions ({savedQuestions.length})</h2>
            <Button
              onClick={() => setActiveTab('create')}
              variant="secondary"
              size="xs"
              icon={Plus}
            >
              Author New Challenge
            </Button>
          </div>

          {savedQuestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-shadow shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider">
                        {q.track || 'General'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {q.duration || 30} mins
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {q.description || 'Custom candidate challenge.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleDeleteSavedQuestion(q.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>

                    <Button
                      onClick={() => handleLaunchTemplate(q)}
                      variant="primary"
                      size="sm"
                      icon={Play}
                    >
                      Launch in Sandbox
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <Code2 className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Custom Questions Created Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Author a custom problem or use a quick preset to tailor practice challenges to your exact stack.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('create')}
                variant="primary"
                size="sm"
                icon={Plus}
              >
                Create First Question
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Preview Problem Modal */}
      {previewTemplate && (
        <Modal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          title={previewTemplate.title}
          size="lg"
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="primary" size="xs">{previewTemplate.track}</Badge>
              <Badge variant="secondary" size="xs">{previewTemplate.difficulty}</Badge>
              <span className="text-slate-500 font-medium">{previewTemplate.duration} mins target</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto">
              {previewTemplate.problemStatement || previewTemplate.description}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Preconfigured Test Cases:</span>
              <div className="space-y-1.5">
                {(previewTemplate.testCases || []).map((tc, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <p className="font-mono text-slate-800 text-[11px]">{tc.input}</p>
                      <p className="text-[10px] text-slate-500">{tc.note}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      {tc.expected}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <Button onClick={() => setPreviewTemplate(null)} variant="secondary" size="sm">
                Close
              </Button>
              <Button
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleLaunchTemplate(t);
                }}
                variant="primary"
                size="sm"
                icon={Play}
              >
                Launch Challenge
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default CandidatePracticeSandbox;
