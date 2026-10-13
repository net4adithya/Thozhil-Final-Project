const supabase = require('./db');

async function seedDatabase() {
  console.log('Starting database reset and seeding...');

  try {
    // 1. Delete existing records (order matters due to foreign keys: Review -> Log -> WorkDescription)
    console.log('Clearing existing reviews, logs, and work descriptions...');
    const { error: delReviewsErr } = await supabase.from('Review').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delReviewsErr) console.error('Error clearing Reviews:', delReviewsErr);

    const { error: delLogsErr } = await supabase.from('Log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delLogsErr) console.error('Error clearing Logs:', delLogsErr);

    const { error: delDescsErr } = await supabase.from('WorkDescription').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delDescsErr) console.error('Error clearing WorkDescriptions:', delDescsErr);

    // 2. Insert original WorkDescriptions
    console.log('Seeding original WorkDescriptions...');
    const workDescriptions = [
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

    const { data: insertedDescs, error: descInsertErr } = await supabase
      .from('WorkDescription')
      .insert(workDescriptions)
      .select();

    if (descInsertErr) {
      console.error('Failed to seed WorkDescriptions:', descInsertErr);
      return;
    }
    console.log(`Seeded ${insertedDescs.length} WorkDescriptions.`);

    // 3. Insert original Logs
    console.log('Seeding original Logs...');
    const logs = [
      {
        id: 'log-1',
        projectId: 'proj-stripe',
        internId: 'intern-sanjay',
        content: 'Completed task 1 and 2. I have added the backend routing in `server.js` matching client customer logins to Stripe portal URLs. Also added Supabase DB listeners for user plan mapping. Webhook signatures are validated using standard credentials. All webhook handlers run successfully. Added unit tests for payment success and billing updates. 100% of tests are passing.',
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        descriptionId: 'desc-1',
        fileUrl: 'server.js, db.js'
      },
      {
        id: 'log-2',
        projectId: 'proj-linear',
        internId: 'intern-aditi',
        content: 'Started conflict resolver setups. Created websocket client scripts. Resolved index errors.',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        descriptionId: 'desc-2',
        fileUrl: 'resolver.js'
      }
    ];

    const { data: insertedLogs, error: logsInsertErr } = await supabase
      .from('Log')
      .insert(logs)
      .select();

    if (logsInsertErr) {
      console.error('Failed to seed Logs:', logsInsertErr);
      return;
    }
    console.log(`Seeded ${insertedLogs.length} Logs.`);

    // 4. Insert original Reviews
    console.log('Seeding original Reviews...');
    const reviews = [
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
        strengths: ['Addressed both backend routing and Supabase integration tasks.', 'Validating webhook signatures properly.', 'Included unit tests with 100% success rate.'],
        bugs: ['Did not document visual feedback states or client-side loader integration in detail.'],
        suggestions: ['Add a brief mention of frontend loading skeletons for user portal transitions in the next sprint.'],
        missing: [],
        managerSummary: 'Sanjay Kumar has successfully completed the Stripe integration log, matching all tasks from the work description. Submissions are high quality and include unit tests.',
        riskLevel: 'low',
        recommendation: 'The intern is on track. Good to proceed.',
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
        strengths: ['Initiated websocket script configurations.'],
        bugs: ['Very brief summary with minimal details (under 15 words).', 'Completely skipped the CRDT synchronization mechanics.', 'No mock network test runs or resolution logs provided.'],
        suggestions: ['Expand log files to include file modifications, terminal logs, and resolved issues.', 'Review the sprint requirements and document testing workflows explicitly.'],
        missing: ['CRDT synchronization handlers.', 'Mock latency network testing suite.', 'Logs showing concurrent resolutions.'],
        managerSummary: 'Aditi Sharma submitted an extremely brief log missing all core synchronization architecture requirements.',
        riskLevel: 'high',
        recommendation: 'Request the intern to resubmit with full implementation files and resolution logs.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: insertedReviews, error: reviewsInsertErr } = await supabase
      .from('Review')
      .insert(reviews)
      .select();

    if (reviewsInsertErr) {
      console.error('Failed to seed Reviews:', reviewsInsertErr);
      return;
    }
    console.log(`Seeded ${insertedReviews.length} Reviews.`);
    console.log('Seeding finished successfully!');
  } catch (e) {
    console.error('Seeding process failed:', e);
  }
}

// Run if script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
