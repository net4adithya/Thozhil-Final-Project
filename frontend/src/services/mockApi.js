// Mock API Service for InterviewX AI
// Handles simulated API calls with latency to mimic production network conditions
// Persists modifications locally via localStorage for realistic session updates

const STORAGE_KEYS = {
  INTERVIEWS: 'interviewx_interviews',
  TEMPLATES: 'interviewx_templates',
  QUESTIONS: 'interviewx_questions',
  CANDIDATES: 'interviewx_candidates',
  SETTINGS: 'interviewx_settings',
};

// Initial standard templates
const INITIAL_TEMPLATES = [
  {
    id: 'tpl-1',
    name: 'Senior Frontend Engineer',
    description: 'Assessment for advanced React development, state management, design systems, and web performance.',
    department: 'Engineering',
    duration: 30, // minutes
    questionCount: 6,
    skills: ['React', 'CSS/Tailwind', 'System Design', 'JavaScript', 'Web Performance', 'Coding'],
    questions: [
      {
        id: 'q-1',
        text: 'Explain the difference between useMemo and useCallback. In what scenarios would you use one over the other?',
        category: 'React',
        duration: 180, // seconds to answer
        difficulty: 'Medium'
      },
      {
        id: 'q-2',
        text: 'How would you architect a reusable component library for an enterprise platform? What are the key considerations for accessibility and styling?',
        category: 'System Design',
        duration: 240,
        difficulty: 'Hard'
      },
      {
        id: 'q-3',
        text: 'Describe how the browser renders a page. How do CSS and JavaScript resources affect this rendering lifecycle, and how would you optimize them?',
        category: 'Web Performance',
        duration: 240,
        difficulty: 'Hard'
      },
      {
        id: 'q-4',
        text: 'What is your strategy for managing complex global state in a React application? Compare Context API, Redux, and Zustand.',
        category: 'React',
        duration: 180,
        difficulty: 'Medium'
      },
      {
        id: 'q-5',
        text: 'Tell me about a time you had a technical disagreement with a team member. How did you approach the discussion and what was the resolution?',
        category: 'Communication',
        duration: 180,
        difficulty: 'Easy'
      },
      {
        id: 'q-6',
        text: 'Write a JavaScript function that takes a string input and reverses each word in it while maintaining their order. The solution must run in linear time.',
        category: 'Coding',
        duration: 300,
        difficulty: 'Medium',
        boilerplate: 'function reverseWords(str) {\n  // Write your code here\n  return "";\n}',
        testCases: [
          { input: '"hello world"', expected: '"olleh dlrow"' },
          { input: '"React coding sandbox"', expected: '"tcaeR gnidoc xobdnas"' }
        ]
      }
    ]
  },
  {
    id: 'tpl-2',
    name: 'Product Manager (Core Platform)',
    description: 'Evaluates product roadmap planning, user research, feature prioritization, and stakeholder communication.',
    department: 'Product Management',
    duration: 25,
    questionCount: 4,
    skills: ['Product Strategy', 'Prioritization', 'User Research', 'Communication'],
    questions: [
      {
        id: 'qp-1',
        text: 'How do you go about prioritizing a product backlog when faced with competing demands from customers, engineering, and sales?',
        category: 'Product Strategy',
        duration: 240,
        difficulty: 'Medium'
      },
      {
        id: 'qp-2',
        text: 'Tell me about a product you launched that failed. What went wrong, what did you learn, and how did you apply that to future projects?',
        category: 'Product Strategy',
        duration: 180,
        difficulty: 'Medium'
      },
      {
        id: 'qp-3',
        text: 'How do you gather user feedback during the early stages of product discovery, and how do you validate that you are solving the right problem?',
        category: 'User Research',
        duration: 180,
        difficulty: 'Easy'
      },
      {
        id: 'qp-4',
        text: 'How would you explain a major delay in a product release to both internal executive stakeholders and primary external customers?',
        category: 'Communication',
        duration: 240,
        difficulty: 'Hard'
      }
    ]
  },
  {
    id: 'tpl-3',
    name: 'Staff Backend Architect (Node/Go)',
    description: 'System design, database optimization, caching, microservices architecture, and API scalability.',
    department: 'Engineering',
    duration: 35,
    questionCount: 5,
    skills: ['System Design', 'Database', 'Scalability', 'Security', 'Problem Solving'],
    questions: [
      {
        id: 'qb-1',
        text: 'How do you design a system to handle 100,000 writes per second while maintaining strong consistency requirements for financial transactions?',
        category: 'Scalability',
        duration: 240,
        difficulty: 'Hard'
      },
      {
        id: 'qb-2',
        text: 'Explain your strategy for migrating a monolithic SQL database to a microservices database architecture without downtime.',
        category: 'System Design',
        duration: 240,
        difficulty: 'Hard'
      },
      {
        id: 'qb-3',
        text: 'What are the pros and cons of using WebSockets vs Long Polling vs Server-Sent Events for real-time messaging updates?',
        category: 'System Design',
        duration: 180,
        difficulty: 'Medium'
      },
      {
        id: 'qb-4',
        text: 'How do you secure your backend APIs against DDOS attacks, SQL injections, and unauthorized privilege escalation?',
        category: 'Security',
        duration: 180,
        difficulty: 'Medium'
      },
      {
        id: 'qb-5',
        text: 'Describe a situation where a service in your production system was running out of memory. How did you diagnose and mitigate the root cause?',
        category: 'Problem Solving',
        duration: 240,
        difficulty: 'Hard'
      }
    ]
  }
];

// Initial Question Bank items
const INITIAL_QUESTIONS = [
  { id: 'qb-q1', text: 'Explain the concept of closures in JavaScript and provide a practical use-case.', category: 'JavaScript', difficulty: 'Medium' },
  { id: 'qb-q2', text: 'Describe the Virtual DOM and how React reconciles elements to update the screen.', category: 'React', difficulty: 'Easy' },
  { id: 'qb-q3', text: 'What is Cross-Site Scripting (XSS) and how can you prevent it in a modern single page application?', category: 'Security', difficulty: 'Medium' },
  { id: 'qb-q4', text: 'How do you optimize web vitals (LCP, FID, CLS) for a media-heavy website?', category: 'Web Performance', difficulty: 'Hard' },
  { id: 'qb-q5', text: 'What are React Fiber nodes and how do they enable concurrent rendering capabilities?', category: 'React', difficulty: 'Hard' },
  { id: 'qb-q6', text: 'Explain the box model in CSS and how box-sizing property changes layout behaviors.', category: 'CSS/Tailwind', difficulty: 'Easy' },
  { id: 'qb-q7', text: 'How would you build a micro-frontend architecture? What are the primary trade-offs?', category: 'System Design', difficulty: 'Hard' },
  { id: 'qb-q8', text: 'What is the Event Loop in JavaScript and how does it manage asynchronous execution blocks?', category: 'JavaScript', difficulty: 'Medium' },
];

// Initial active and draft interviews
const INITIAL_INTERVIEWS = [
  {
    id: 'int-1',
    title: 'Senior React Developer Hiring',
    jobRole: 'Senior React Developer',
    company: 'Cyberdyne Systems',
    interviewType: 'async',
    templateId: 'tpl-1',
    department: 'Engineering',
    status: 'Active',
    candidateCount: 4,
    completedCount: 3,
    createdDate: '2026-08-01',
    duration: 30,
    questions: INITIAL_TEMPLATES[0].questions,
  },
  {
    id: 'int-2',
    title: 'Product Owner - Search Experience',
    jobRole: 'Product Owner',
    company: 'SearchCorp',
    interviewType: 'live',
    templateId: 'tpl-2',
    department: 'Product Management',
    status: 'Active',
    candidateCount: 3,
    completedCount: 1,
    createdDate: '2026-08-04',
    duration: 25,
    questions: INITIAL_TEMPLATES[1].questions,
  },
  {
    id: 'int-3',
    title: 'Principal Security Analyst',
    jobRole: 'Security Analyst',
    company: 'Apex Security',
    interviewType: 'async',
    templateId: '',
    department: 'Information Security',
    status: 'Draft',
    candidateCount: 0,
    completedCount: 0,
    createdDate: '2026-08-06',
    duration: 20,
    questions: [
      { id: 'qsec-1', text: 'Describe a incident response framework and how you isolate infected systems.', category: 'Security', duration: 180, difficulty: 'Medium' }
    ],
  }
];

// Initial mock candidates details
const INITIAL_CANDIDATES = [
  {
    id: 'cand-1',
    name: 'Sarah Connor',
    email: 'sarah.c@skymail.net',
    role: 'Senior React Developer Hiring',
    interviewId: 'int-1',
    status: 'Completed',
    overallScore: 88,
    completionDate: '2026-08-03',
    avatarInitials: 'SC',
    skills: [
      { name: 'React', score: 92 },
      { name: 'CSS/Tailwind', score: 85 },
      { name: 'System Design', score: 80 },
      { name: 'JavaScript', score: 95 },
      { name: 'Web Performance', score: 90 },
    ],
    recommendation: 'STRONG HIRE',
    summary: 'Sarah demonstrates an exceptional grasp of JavaScript runtime behaviors and React render cycles. Her approach to designing accessible component architectures is mature, utilizing structural design principles. She is highly recommended for backend integrations and design system architectures.',
    strengths: [
      'In-depth knowledge of React hooks internals and fiber reconciliation.',
      'Excellent performance profiling skills, identifying paint flashes and bundle bottlenecks.',
      'Clear, concise communication with structured reasoning.'
    ],
    weaknesses: [
      'Prefers single-repo solutions; could show more familiarity with advanced micro-frontend orchestration details.',
      'Sometimes goes deep into technical side-tracks, though handles redirection gracefully.'
    ],
    timeline: [
      { questionId: 'q-1', score: 95, timeTaken: 110, comments: 'Extremely clear breakdown of closures in hooks. Identified cache invalidation edge cases.' },
      { questionId: 'q-2', score: 82, timeTaken: 220, comments: 'Good approach to accessibility (ARIA roles). Component lifecycle division was clear.' },
      { questionId: 'q-3', score: 90, timeTaken: 195, comments: 'Explained the critical rendering path accurately. Detailed script defer/async differences.' },
      { questionId: 'q-4', score: 85, timeTaken: 145, comments: 'Fair comparison of state containers. Suggested lightweight options for basic contexts.' },
      { questionId: 'q-5', score: 90, timeTaken: 130, comments: 'A structured resolution story illustrating emotional intelligence and technical alignment.' },
      { questionId: 'q-6', score: 98, timeTaken: 180, comments: 'Optimal linear time solution. All compiler test cases passed successfully.' }
    ],
    transcripts: {
      'q-1': "useMemo is designed to memoize the return value of a function, preventing expensive computations on every render. useCallback memoizes the function definition itself, which is vital when passing callbacks to optimized child components to avoid broken reference checks. For instance, if you have a child component wrapped in React.memo and pass down an inline arrow function, it gets recreated every render, rendering React.memo useless. That's when useCallback shines. You shouldn't wrap everything in them, as there's a baseline overhead to hooks hook-keeping.",
      'q-2': "When building a reusable component library, my base layer starts with semantic HTML and headless UI libraries if possible, like Radix. Accessibility should be baked-in, using proper ARIA labels, keyboard trap managers for modals, and screen reader announcements. For styling, using Tailwind with class-merge helper utilities allows consumers to overwrite parameters cleanly. The design system is set using CSS variables for theme consistency.",
      'q-3': "The rendering path begins with fetching HTML, compiling DOM tree, loading CSS, compiling CSSOM, merging them to form the render tree. JS files block the execution if they are in the header unless annotated. I optimize this using critical CSS extraction, deferring non-essential JS, bundling image assets dynamically, and setting lazy loading elements.",
      'q-4': "For standard application configurations, I use React Context API. When dealing with high-frequency updates, Context might trigger excessive child renders, in which case Zustand is my go-to choice due to its simple selector-based subscription model. I only resort to Redux if the project features a massive ecosystem of middleware plugins.",
      'q-5': "In my last role, we were deciding whether to deploy a custom calendar scheduler or plug in a SaaS widget. The lead engineer wanted custom code, but I argued for the SaaS product to hit the MVP timeline. I set up a simple matrix listing development speed, costs, and maintainability. We agreed to go with the SaaS wrapper for V1 and schedule a tech-debt review for V2. It kept us on timeline without burning bridges.",
      'q-6': "Here is my solution. It splits the string by space, reverses each word individually using pointers, and joins them back. It is O(N) time complexity and O(N) auxiliary space."
    },
    codeAnswers: {
      'q-6': {
        code: 'function reverseWords(str) {\n  return str.split(" ").map(word => word.split("").reverse().join("")).join(" ");\n}',
        language: 'javascript',
        testCasesResult: [
          { input: '"hello world"', expected: '"olleh dlrow"', actual: '"olleh dlrow"', passed: true },
          { input: '"React coding sandbox"', expected: '"tcaeR gnidoc xobdnas"', actual: '"tcaeR gnidoc xobdnas"', passed: true }
        ],
        compileTime: 14,
        status: 'Accepted'
      }
    }
  },
  {
    id: 'cand-2',
    name: 'David Lightman',
    email: 'wargames@norad.mil',
    role: 'Senior React Developer Hiring',
    interviewId: 'int-1',
    status: 'Completed',
    overallScore: 74,
    completionDate: '2026-08-04',
    avatarInitials: 'DL',
    skills: [
      { name: 'React', score: 70 },
      { name: 'CSS/Tailwind', score: 75 },
      { name: 'System Design', score: 65 },
      { name: 'JavaScript', score: 85 },
      { name: 'Web Performance', score: 75 },
    ],
    recommendation: 'HIRE WITH RESERVATIONS',
    summary: 'David has strong algorithmic knowledge and native JavaScript capabilities, but his React development patterns lean slightly legacy. He struggled somewhat with detailed web vitals optimizations but demonstrated highly agile thinking and rapid debugging skills.',
    strengths: [
      'Excellent understanding of JavaScript events and browser APIs.',
      'Highly curious, self-driven troubleshooting mind.',
      'Quick implementation velocity.'
    ],
    weaknesses: [
      'Struggles to keep hooks optimized, causing unnecessary component cycles.',
      'Component separation boundaries are bloated; creates massive file scopes.'
    ],
    timeline: [
      { questionId: 'q-1', score: 75, timeTaken: 155, comments: 'Described basic differences correctly but missed rendering efficiency gains.' },
      { questionId: 'q-2', score: 70, timeTaken: 200, comments: 'Focused on styling and skipped accessibility details until explicitly nudged.' },
      { questionId: 'q-3', score: 75, timeTaken: 230, comments: 'Described JS parsing blocking behavior, but omitted layout shifting details.' },
      { questionId: 'q-4', score: 70, timeTaken: 160, comments: 'Heavy reliance on Redux without noting modern lighter alternatives.' },
      { questionId: 'q-5', score: 80, timeTaken: 140, comments: 'Very honest and collaborative story about resolving system configurations.' }
    ],
    transcripts: {
      'q-1': "useMemo computes values on render only if the values in the dependencies array change. useCallback returns a memoized callback. They are used for optimizing rendering by keeping references the same. Honestly, for simple components, they might be overkill because checking the dependencies array itself has a minor memory allocation check, but for heavy calculations, they are great.",
      'q-2': "Architecting a component library requires a folder structure containing index exports for every component. Styling is easiest with styled-components or Tailwind. You make buttons, inputs, dropdowns, and group them. You make sure text contrasts are high for accessibility, and you can test it using screen readers.",
      'q-3': "The browser fetches the index page, parses the DOM, requests files. CSS blocks rendering, JavaScript blocks DOM parsing. To optimize, you minify assets, load images using lazy tags, use responsive image wrappers, and leverage CDN caches to minimize geographical latency.",
      'q-4': "I usually implement Redux because it is very structured. I create actions, reducers, store, and inject it with a provider. It makes tracking actions and tracking state modifications very robust, although it does take a lot of boilerplate files to write even for small features.",
      'q-5': "A team member wanted to write a complex custom graph layout using Canvas, and I recommended D3. We set up a brief prototype competition. We spent 4 hours each. D3 won easily since it had built-in physics models, and he happily agreed that we should use D3 instead of rebuilding physics from scratch."
    }
  },
  {
    id: 'cand-3',
    name: 'Marcus Wright',
    email: 'marcus.w@cyberdyne.co',
    role: 'Senior React Developer Hiring',
    interviewId: 'int-1',
    status: 'Reviewing',
    overallScore: 61,
    completionDate: '2026-08-06',
    avatarInitials: 'MW',
    skills: [
      { name: 'React', score: 55 },
      { name: 'CSS/Tailwind', score: 60 },
      { name: 'System Design', score: 50 },
      { name: 'JavaScript', score: 70 },
      { name: 'Web Performance', score: 70 },
    ],
    recommendation: 'DO NOT HIRE',
    summary: 'Marcus has basic frontend capabilities but struggled with core React hooks, design patterns, and asynchronous rendering details. His system architecture solutions lacked scalability guarantees and his performance strategies were rudimentary.',
    strengths: [
      'Solid native CSS background.',
      'Responsive design details.'
    ],
    weaknesses: [
      'Weak understanding of hook behaviors and memoization.',
      'Unfamiliar with standard state managers.',
      'Struggles with communication and structures ideas poorly.'
    ],
    timeline: [
      { questionId: 'q-1', score: 50, timeTaken: 175, comments: 'Struggled to explain the difference in hook memory reference mechanics.' },
      { questionId: 'q-2', score: 62, timeTaken: 238, comments: 'Good responsive coding details but completely missed screen-readers and accessibility attributes.' },
      { questionId: 'q-3', score: 70, timeTaken: 200, comments: 'Identified script parsing blocker behaviors accurately.' },
      { questionId: 'q-4', score: 55, timeTaken: 178, comments: 'Lacked understanding of Context performance issues.' },
      { questionId: 'q-5', score: 68, timeTaken: 165, comments: 'Brief communication detailing standard review cycle, lacks detailed agency.' }
    ],
    transcripts: {
      'q-1': "useMemo and useCallback are just used to speed up things. I think useMemo stores values and useCallback stores standard functions. I don't use them too much unless a component is lagging. Usually, React is fast enough out of the box.",
      'q-2': "To make a component library, I create folders for each component and build them with CSS grid or flexbox. You can use Tailwind or inline CSS. We make sure they work on mobile and tablet using breakpoints. Reusability is achieved by passing props.",
      'q-3': "Browser parses page from top to bottom. If it hits a script, it downloads and executes it, blocking other files. We put scripts at the bottom or use the defer keyword. Images should be compressed using modern formats like WebP.",
      'q-4': "Context API is standard for React. You write a Provider, pass state as value, and access it with useContext. It works well, but if you put a lot of things inside it, it can cause the whole screen to redraw, which might get slow.",
      'q-5': "We had a disagreement about tabs vs spaces. I preferred tabs for accessibility, and the team preferred spaces. We ended up setting a Prettier config in the repository to format files on commits automatically, which saved us discussing it further."
    }
  },
  {
    id: 'cand-4',
    name: 'Ellen Ripley',
    email: 'ripley@nostromo.org',
    role: 'Senior React Developer Hiring',
    interviewId: 'int-1',
    status: 'Invited',
    overallScore: null,
    completionDate: null,
    avatarInitials: 'ER',
    skills: [],
    recommendation: 'PENDING INTERVIEW',
    summary: 'Candidate has been invited to complete the assessment.',
    strengths: [],
    weaknesses: [],
    timeline: [],
    transcripts: {}
  },
  {
    id: 'cand-5',
    name: 'John Connor',
    email: 'john.c@skymail.net',
    role: 'Product Owner - Search Experience',
    interviewId: 'int-2',
    status: 'Completed',
    overallScore: 84,
    completionDate: '2026-08-05',
    avatarInitials: 'JC',
    skills: [
      { name: 'Product Strategy', score: 85 },
      { name: 'Prioritization', score: 80 },
      { name: 'User Research', score: 90 },
      { name: 'Communication', score: 81 },
    ],
    recommendation: 'HIRE',
    summary: 'John demonstrates exceptional project focus, user research insights, and a practical prioritization methodology. He has high leadership qualities and structured communication channels.',
    strengths: [
      'Strong empathy-driven user discovery models.',
      'Clear stakeholder communication and conflict resolution.',
      'Rigorous priority scoring templates.'
    ],
    weaknesses: [
      'Slightly weaker on developer-facing technical architectures.',
      'Could showcase more data/analytics-heavy telemetry frameworks.'
    ],
    timeline: [
      { questionId: 'qp-1', score: 80, timeTaken: 195, comments: 'Uses standard RICE scorecard. Clear understanding of engineering capacity.' },
      { questionId: 'qp-2', score: 85, timeTaken: 170, comments: 'Very honest breakdown of an app release that lacked user discovery. Handled failures with reflection.' },
      { questionId: 'qp-3', score: 92, timeTaken: 160, comments: 'Emphasized qualitative user interviews and interactive canvas wireframing for feature proofing.' },
      { questionId: 'qp-4', score: 80, timeTaken: 210, comments: 'Maintained extreme alignment and transparent project delay updates.' }
    ],
    transcripts: {
      'qp-1': "To prioritize, I apply the RICE framework: Reach, Impact, Confidence, and Effort. Reach and Impact are defined with product analytics, Confidence is validated with user research, and Effort is provided by the development team. I lay these out in a matrix, map them against company objectives, and run alignment calls to iron out discrepancies.",
      'qp-2': "We launched a dashboard widget designed to automate email follow-ups. We skipped direct customer interviews because we assumed the request was universal. It flopped because the custom variables were too rigid. We learned to prototype and get five user validation sessions before coding.",
      'qp-3': "I select a cohort of 5 to 7 users representing target segments, write an interview script focused on behaviors and pain points, and build low-fidelity interactive Figma wireframes. I observe them use the flow, noting where they stumble, instead of asking if they like it.",
      'qp-4': "With customers, you frame the delay in terms of quality. You tell them you are refining the performance and security to guarantee their stability. With internal stakeholders, you outline the blocking factors, the adjusted timelines, resource changes, and the impact on our quarterly projections."
    }
  },
  {
    id: 'cand-6',
    name: 'Kyle Reese',
    email: 'kyle.reese@resistance.net',
    role: 'Product Owner - Search Experience',
    interviewId: 'int-2',
    status: 'Invited',
    overallScore: null,
    completionDate: null,
    avatarInitials: 'KR',
    skills: [],
    recommendation: 'PENDING INTERVIEW',
    summary: 'Candidate has been invited to complete the assessment.',
    strengths: [],
    weaknesses: [],
    timeline: [],
    transcripts: {}
  }
];

// Helper to initialize database if empty
const initializeDb = () => {
  const existingInts = localStorage.getItem(STORAGE_KEYS.INTERVIEWS);
  let shouldReset = false;
  if (existingInts) {
    try {
      const parsed = JSON.parse(existingInts);
      if (parsed.length > 0 && !parsed[0].interviewType) {
        shouldReset = true;
      }
    } catch(e) {
      shouldReset = true;
    }
  } else {
    shouldReset = true;
  }

  if (shouldReset) {
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(INITIAL_INTERVIEWS));
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
      companyName: 'Video Interviewer Corp',
      recruiterName: 'Alex Rivera',
      recruiterEmail: 'alex.rivera@videointerviewer.com',
      plan: 'Enterprise Pro',
      apiKey: 'vi_live_81j8fs82kjasd9812kasn9',
      cameraSelected: 'default-cam',
      micSelected: 'default-mic'
    }));
  }
};

// Initialize
initializeDb();

// Helper simulation of delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // --- INTERVIEWS ---
  getInterviews: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
  },

  getInterviewById: async (id) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    return list.find(item => item.id === id) || null;
  },

  createInterview: async (data) => {
    await delay(500);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    const newInterview = {
      id: `int-${Date.now()}`,
      candidateCount: 0,
      completedCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      ...data,
    };
    list.push(newInterview);
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(list));
    return newInterview;
  },

  updateInterviewStatus: async (id, status) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    const idx = list.findIndex(item => item.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(list));
      return list[idx];
    }
    throw new Error('Interview not found');
  },

  deleteInterview: async (id) => {
    await delay();
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    list = list.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(list));
    return true;
  },

  // --- TEMPLATES ---
  getTemplates: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES));
  },

  getTemplateById: async (id) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES));
    return list.find(item => item.id === id) || null;
  },

  createTemplate: async (data) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES));
    const newTemplate = {
      id: `tpl-${Date.now()}`,
      questionCount: data.questions?.length || 0,
      ...data
    };
    list.push(newTemplate);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(list));
    return newTemplate;
  },

  // --- QUESTION BANK ---
  getQuestions: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS));
  },

  addQuestion: async (data) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS));
    const newQuestion = {
      id: `qb-q${Date.now()}`,
      ...data
    };
    list.push(newQuestion);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(list));
    return newQuestion;
  },

  // --- CANDIDATES ---
  getCandidates: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));
  },

  getCandidatesByInterviewId: async (interviewId) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));
    return list.filter(item => item.interviewId === interviewId);
  },

  getCandidateById: async (id) => {
    await delay();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));
    return list.find(item => item.id === id) || null;
  },

  inviteCandidate: async (data) => {
    await delay(400);
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));
    const newCandidate = {
      id: `cand-${Date.now()}`,
      overallScore: null,
      completionDate: null,
      status: 'Invited',
      avatarInitials: data.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      skills: [],
      strengths: [],
      weaknesses: [],
      timeline: [],
      transcripts: {},
      ...data,
    };
    list.push(newCandidate);
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(list));

    // Increment candidate count on interview
    const interviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    const intIdx = interviews.findIndex(item => item.id === data.interviewId);
    if (intIdx !== -1) {
      interviews[intIdx].candidateCount += 1;
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews));
    }

    return newCandidate;
  },

  submitCandidateInterviewAnswers: async (candidateId, answers, codeAnswers = {}) => {
    await delay(1000); // simulate analysis delay
    const candidates = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));
    const candIdx = candidates.findIndex(c => c.id === candidateId);

    if (candIdx === -1) throw new Error('Candidate not found');

    const candidate = candidates[candIdx];
    const interview = (JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS))).find(i => i.id === candidate.interviewId);

    // Generate AI assessment mock scores and evaluations
    const skillsList = interview ?
      (interview.questions.map(q => q.category).filter((v, i, a) => a.indexOf(v) === i)) :
      ['Communication', 'Problem Solving'];

    const candidateSkills = skillsList.map(s => ({
      name: s,
      score: Math.floor(Math.random() * 25) + 70 // 70 to 95 score
    }));

    const avgScore = Math.floor(candidateSkills.reduce((acc, curr) => acc + curr.score, 0) / candidateSkills.length);
    const timeline = Object.keys(answers).map(qId => {
      const q = interview ? interview.questions.find(qi => qi.id === qId) : null;
      return {
        questionId: qId,
        score: Math.floor(Math.random() * 30) + 65,
        timeTaken: q ? Math.floor(q.duration * 0.7) : 120,
        comments: `Demonstrated core knowledge on topic ${q ? q.category : 'General'}. Clear syntax approach and structure.`
      };
    });

    candidate.status = 'Completed';
    candidate.overallScore = avgScore;
    candidate.completionDate = new Date().toISOString().split('T')[0];
    candidate.skills = candidateSkills;
    candidate.recommendation = avgScore >= 85 ? 'STRONG HIRE' : avgScore >= 70 ? 'HIRE' : 'DO NOT HIRE';
    candidate.summary = `Autonomous evaluation complete. The candidate completed all the requested components. Demonstrated a reliable execution timeline, scoring on average ${avgScore}% across ${candidateSkills.length} key evaluation vectors. Core concepts were addressed with clear verbal syntax structure.`;
    candidate.strengths = [
      'Responsive, structured answering structure.',
      'Addressed standard optimization and safety checks.',
      'Comfortable communicating logic details.'
    ];
    candidate.weaknesses = [
      'Could show more depth in high scalability details.',
      'Slight hesitation in initial architectural steps.'
    ];
    candidate.timeline = timeline;
    candidate.transcripts = answers;
    candidate.codeAnswers = codeAnswers;

    candidates[candIdx] = candidate;
    localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));

    // Update interview completedCount
    const interviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    const intIdx = interviews.findIndex(i => i.id === candidate.interviewId);
    if (intIdx !== -1) {
      interviews[intIdx].completedCount += 1;
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews));
    }

    return candidate;
  },

  // --- SETTINGS ---
  getSettings: async () => {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
  },

  updateSettings: async (data) => {
    await delay();
    const settings = {
      ...JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)),
      ...data
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // --- ANALYTICS ---
  getAnalytics: async () => {
    await delay();
    const interviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.INTERVIEWS));
    const candidates = JSON.parse(localStorage.getItem(STORAGE_KEYS.CANDIDATES));

    const activeIntCount = interviews.filter(i => i.status === 'Active').length;
    const completedCandCount = candidates.filter(c => c.status === 'Completed').length;

    // Overall average score
    const completedCandidates = candidates.filter(c => c.status === 'Completed');
    const avgScore = completedCandidates.length > 0 ?
      Math.round(completedCandidates.reduce((acc, curr) => acc + curr.overallScore, 0) / completedCandidates.length) : 0;

    // Weekly completions mock dataset
    const weeklyCompletions = [
      { name: 'Mon', count: 2 },
      { name: 'Tue', count: 4 },
      { name: 'Wed', count: 3 },
      { name: 'Thu', count: 6 },
      { name: 'Fri', count: 5 },
      { name: 'Sat', count: 1 },
      { name: 'Sun', count: 0 },
    ];

    // Score distribution dataset
    const scoreDistribution = [
      { range: '0-50', count: 0 },
      { range: '50-60', count: 1 },
      { range: '60-70', count: 1 },
      { range: '70-80', count: 3 },
      { range: '80-90', count: 4 },
      { range: '90-100', count: 2 },
    ];

    return {
      kpis: {
        activeInterviews: activeIntCount,
        totalInvited: candidates.length,
        completions: completedCandCount,
        averageScore: avgScore,
        conversionRate: Math.round((completedCandCount / Math.max(1, candidates.length)) * 100),
      },
      weeklyCompletions,
      scoreDistribution,
      departmentStats: [
        { name: 'Engineering', count: 8, avg: 76 },
        { name: 'Product', count: 3, avg: 82 },
        { name: 'Design', count: 2, avg: 79 },
      ]
    };
  }
};
