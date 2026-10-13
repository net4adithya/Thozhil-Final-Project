const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const realSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
);

// Keep offline database records local to allow offline usage
const mockDbFile = path.join(__dirname, 'mock_db.json');
let store = {
  WorkDescription: [],
  Log: [],
  Review: []
};

// Seed mock DB with initial values if file doesn't exist
const seedMockDb = () => {
  store.WorkDescription = [
    {
      id: 'desc-1',
      projectId: 'proj-stripe',
      authorityId: 'auth-jenkins',
      description: '### Sprint Objective\nComplete the integration of Stripe Customer Portal with direct sync to our billing schema.\n\n### Core Tasks\n1. Set up an Express endpoint `/api/billing/portal` mapping user tokens to Customer Portal sessions.\n2. Handle `customer.subscription.updated` and `invoice.payment_succeeded` webhook operations with absolute consistency.\n3. Implement proper client-side loading spinners and error screens.\n\n### Expectations\nEnsure all DB updates are wrapped in clean transactions. Write unit tests for the webhook handler. Submit a draft log listing endpoint responses, DB schemas modified, and test results.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'desc-2',
      projectId: 'proj-linear',
      authorityId: 'auth-rivers',
      description: '### Sync Architecture Objective\nImplement conflict resolution handlers on the WebSocket channel.\n\n### Core Tasks\n- Hook up a last-write-wins CRDT strategy for updating card states.\n- Create a mock latency network testing suite inside `/test/network.ts`.\n- Write proper logs showing concurrent resolution outputs.\n\n### Requirements\nLogs should explicitly show how conflicts are resolved when two users drag cards simultaneously.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  store.Log = [
    {
      id: 'log-1',
      projectId: 'proj-stripe',
      internId: 'intern-sanjay',
      content: 'Completed task 1 and 2. I have added the backend routing in `server.js` matching client customer logins to Stripe portal URLs. Also added Supabase DB listeners for user plan mapping. Webhook signatures are validated using standard credentials. All webhook handlers run successfully. Added unit tests for payment success and billing updates. 100% of tests are passing.',
      fileNames: ['server.js', 'auth.js'],
      uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      descriptionId: 'desc-1'
    },
    {
      id: 'log-2',
      projectId: 'proj-linear',
      internId: 'intern-aditi',
      content: 'Started conflict resolver setups. Created websocket client scripts. Resolved index errors.',
      fileNames: ['client.js'],
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      descriptionId: 'desc-2'
    }
  ];

  store.Review = [
    {
      id: 'rev-1',
      logId: 'log-1',
      score: 92,
      feedback: JSON.stringify({
        summary: 'Outstanding log submission. Sanjay has covered all components including webhook routing, database hooks, signature verification, and full test suites. Very structured and detailed developer update.',
        speechText: 'Outstanding log submission. Sanjay has covered all components including webhook routing, database hooks, signature verification, and full test suites. Very structured and detailed developer update.',
        strengths: ['Addressed both backend routing and Supabase integration tasks.', 'Validating webhook signatures properly.', 'Included unit tests with 100% success rate.'],
        weaknesses: ['Did not document visual feedback states or client-side loader integration in detail.'],
        suggestions: ['Add a brief mention of frontend loading skeletons for user portal transitions in the next sprint.']
      }),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'rev-2',
      logId: 'log-2',
      score: 42,
      feedback: JSON.stringify({
        summary: 'The log is extremely short and does not address core requirements. Missing the concurrent resolution details, test suites, and latency resolution outputs requested by the architect.',
        speechText: 'The log is extremely short and does not address core requirements. Missing the concurrent resolution details, test suites, and latency resolution outputs requested by the architect.',
        strengths: ['Initiated websocket script configurations.'],
        weaknesses: ['Very brief summary with minimal details (under 15 words).', 'Completely skipped the CRDT synchronization mechanics.', 'No mock network test runs or resolution logs provided.'],
        suggestions: ['Expand log files to include file modifications, terminal logs, and resolved issues.', 'Review the sprint requirements and document testing workflows explicitly.']
      }),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  saveStore();
};

const saveStore = () => {
  try {
    fs.writeFileSync(mockDbFile, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('[Offline DB] Failed to save mock DB file:', e.message);
  }
};

// Load existing DB
if (fs.existsSync(mockDbFile)) {
  try {
    store = JSON.parse(fs.readFileSync(mockDbFile, 'utf8'));
  } catch (e) {
    console.error('[Offline DB] Failed to parse existing mock DB file. Seeding fresh database.', e.message);
    seedMockDb();
  }
} else {
  seedMockDb();
}

let useMock = false;

// Fast validation check
// Fast validation check against real Supabase client
async function checkConnection() {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_KEY missing');
    
    // Perform a lightweight authenticated query to validate key and REST API
    const { error } = await realSupabase.from('assignments').select('id').limit(1);
    if (error && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      throw error;
    }
    
    console.log('[Supabase] Connection verified successfully. Using cloud database.');
  } catch (e) {
    console.warn(`[Supabase] Connection error: ${e.message}. Falling back to offline mock database.`);
    useMock = true;
  }
}
checkConnection();

class QueryBuilder {
  constructor(tableName, data) {
    this.tableName = tableName;
    this.data = data || [];
    this.filters = [];
    this.orders = [];
    this.limitVal = null;
    this._insertData = null;
  }

  select(fields) {
    return this;
  }

  eq(field, value) {
    this.filters.push(item => item[field] === value);
    return this;
  }

  order(field, options = { ascending: true }) {
    const ascending = options && options.ascending !== false;
    this.orders.push((a, b) => {
      const valA = a[field] ? new Date(a[field]).getTime() || a[field] : 0;
      const valB = b[field] ? new Date(b[field]).getTime() || b[field] : 0;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(count) {
    this.limitVal = count;
    return this;
  }

  insert(rows) {
    this._insertData = rows;
    return this;
  }

  async execute() {
    let result = [...this.data];

    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter);
    }

    // Apply orders
    for (const order of this.orders) {
      result.sort(order);
    }

    // Apply limit
    if (this.limitVal !== null) {
      result = result.slice(0, this.limitVal);
    }

    return result;
  }

  async single() {
    if (this._insertData) {
      const newRows = this._insertData.map(row => {
        const newRow = {
          id: 'mock-' + Math.random().toString(36).substring(2, 9),
          createdAt: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
          ...row
        };
        store[this.tableName].push(newRow);
        return newRow;
      });
      saveStore();
      return { data: newRows[0], error: null };
    }
    const res = await this.execute();
    return {
      data: res[0] || null,
      error: res[0] ? null : {
        code: 'PGRST116',
        details: 'The result contains 0 rows',
        hint: null,
        message: 'JSON object requested, multiple (or no) rows returned'
      }
    };
  }

  async maybeSingle() {
    if (this._insertData) {
      return this.single();
    }
    const res = await this.execute();
    return { data: res[0] || null, error: null };
  }

  // Allow thenable to support await on the builder directly
  async then(resolve, reject) {
    try {
      if (this._insertData) {
        const newRows = this._insertData.map(row => {
          const newRow = {
            id: 'mock-' + Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString(),
            uploadedAt: new Date().toISOString(),
            ...row
          };
          store[this.tableName].push(newRow);
          return newRow;
        });
        saveStore();
        resolve({ data: newRows, error: null });
      } else {
        const res = await this.execute();
        resolve({ data: res, error: null });
      }
    } catch (err) {
      resolve({ data: null, error: err });
    }
  }
}

const mockSupabase = {
  from(tableName) {
    if (!store[tableName]) {
      store[tableName] = [];
    }
    return new QueryBuilder(tableName, store[tableName]);
  }
};

const supabaseProxy = {
  from(tableName) {
    if (useMock) {
      return mockSupabase.from(tableName);
    }

    const realBuilder = realSupabase.from(tableName);

    const interceptBuilder = (builder, callChain = []) => {
      const handler = {
        get(target, prop, receiver) {
          const orig = target[prop];
          if (typeof orig === 'function') {
            return function(...args) {
              const newChain = [...callChain, { prop, args }];
              const res = orig.apply(target, args);

              const replayOnMock = async () => {
                let mockBuilder = mockSupabase.from(tableName);
                for (const step of newChain) {
                  if (typeof mockBuilder[step.prop] === 'function') {
                    mockBuilder = mockBuilder[step.prop](...step.args);
                  }
                }
                return await mockBuilder;
              };

              if (res && typeof res.then === 'function') {
                const origThen = res.then;
                res.then = function(onFulfilled, onRejected) {
                  return origThen.call(res, 
                    async (val) => {
                      if (val && val.error && (val.error.message.includes('fetch failed') || val.error.message.includes('ENOTFOUND') || val.error.message.includes('timeout'))) {
                        console.warn(`[Supabase Proxy] Query failed: "${val.error.message}". Replaying chain on mock DB.`);
                        useMock = true;
                        const mockResult = await replayOnMock();
                        return onFulfilled(mockResult);
                      }
                      return onFulfilled(val);
                    },
                    async (err) => {
                      console.warn(`[Supabase Proxy] Exception: "${err.message}". Replaying chain on mock DB.`);
                      useMock = true;
                      const mockResult = await replayOnMock();
                      return onFulfilled(mockResult);
                    }
                  );
                };
              }
              return interceptBuilder(res, newChain);
            };
          }
          return orig;
        }
      };
      return new Proxy(builder, handler);
    };

    return interceptBuilder(realBuilder);
  }
};

module.exports = supabaseProxy;