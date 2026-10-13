/**
 * Standard Role Templates for Assessment Quick-Launch
 */
export const ASSESSMENT_TEMPLATES = [
  {
    id: 'tpl-react-senior',
    name: 'Senior Frontend Engineer (React)',
    department: 'Engineering',
    duration: 45,
    questionCount: 4,
    description: 'Comprehensive evaluation covering React 19 architecture, memoization, performance profiling, and accessible design systems.',
    skills: ['React', 'TypeScript', 'State Management', 'Web Performance'],
    questions: [
      {
        text: 'Explain the difference between useMemo and useCallback in React. In what real-world scenarios does improper memoization actually hurt performance?',
        category: 'React Architecture',
        duration: 180,
        timeLimit: 180,
        difficulty: 'Medium'
      },
      {
        text: 'How would you architect a reusable, fully accessible design system component library supporting dark mode and keyboard navigation?',
        category: 'UI & Accessibility',
        duration: 240,
        timeLimit: 240,
        difficulty: 'Hard'
      },
      {
        text: 'Describe how the browser Critical Rendering Path works and what strategies you use to optimize Largest Contentful Paint (LCP).',
        category: 'Web Performance',
        duration: 180,
        timeLimit: 180,
        difficulty: 'Medium'
      },
      {
        text: 'Compare Zustand with Redux Toolkit and the React Context API for enterprise state management. When would you choose one over the others?',
        category: 'State Management',
        duration: 180,
        timeLimit: 180,
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'tpl-backend-arch',
    name: 'Distributed Systems Architect',
    department: 'Infrastructure',
    duration: 60,
    questionCount: 3,
    description: 'High-scale backend evaluation covering message queues, distributed consensus, data consistency, and database sharding.',
    skills: ['Distributed Systems', 'Node.js/Go', 'Kafka/RabbitMQ', 'PostgreSQL/Redis'],
    questions: [
      {
        text: 'How do you design a real-time WebSocket state synchronization engine that handles 100,000 concurrent connections with automatic reconnect buffering?',
        category: 'System Architecture',
        duration: 240,
        timeLimit: 240,
        difficulty: 'Hard'
      },
      {
        text: 'Explain idempotency strategies for handling webhook retries and payment processing in an eventually consistent microservice mesh.',
        category: 'Backend Engineering',
        duration: 240,
        timeLimit: 240,
        difficulty: 'Hard'
      },
      {
        text: 'Describe the trade-offs between optimistic locking and pessimistic locking in PostgreSQL for high-contention inventory reservation.',
        category: 'Database Systems',
        duration: 180,
        timeLimit: 180,
        difficulty: 'Medium'
      }
    ]
  },
  {
    id: 'tpl-ai-engineer',
    name: 'AI / Machine Learning Engineer',
    department: 'Artificial Intelligence',
    duration: 45,
    questionCount: 3,
    description: 'Specialized interview for conversational AI pipelines, prompt injection defense, LLM evaluation metrics, and speech-to-text integration.',
    skills: ['LLM Orchestration', 'Python', 'Sarvam AI', 'Vector DBs', 'Evaluation'],
    questions: [
      {
        text: 'How do you detect and defend against adversarial prompt injection attacks when candidate transcripts are passed to conversational LLMs?',
        category: 'AI Security',
        duration: 240,
        timeLimit: 240,
        difficulty: 'Hard'
      },
      {
        text: 'Explain your strategy for low-latency streaming TTS audio synthesis with real-time browser playback over WebSockets.',
        category: 'Voice AI Systems',
        duration: 180,
        timeLimit: 180,
        difficulty: 'Medium'
      },
      {
        text: 'How do you structure deterministic scoring and rubric alignment for multi-turn LLM candidate evaluation reports?',
        category: 'Evaluation Engine',
        duration: 240,
        timeLimit: 240,
        difficulty: 'Hard'
      }
    ]
  }
];

export const getTemplateById = (id) => {
  return ASSESSMENT_TEMPLATES.find((t) => t.id === id) || null;
};
