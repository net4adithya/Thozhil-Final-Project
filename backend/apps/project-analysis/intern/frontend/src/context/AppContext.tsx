import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Role = 'authority' | 'intern' | 'none';
export type Theme = 'light' | 'dark';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  members: TeamMember[];
  authorityName: string;
}

export interface WorkDescription {
  id: string;
  projectId: string;
  authorityId: string;
  assigneeId: string;
  description: string;
  createdAt: string;
}

export interface AIReview {
  id: string;
  logId: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  confidence: number;
  createdAt: string;
  managerSummary?: string;
  riskLevel?: string;
  recommendation?: string;
  missing?: string[];
  speech_text?: string;
}

export interface WorkLog {
  id: string;
  projectId: string;
  internId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
  descriptionId?: string;
  review?: AIReview;
}

interface AppContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  role: Role;
  setRole: (r: Role) => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  workDescriptions: WorkDescription[];
  workLogs: WorkLog[];
  isLoading: boolean;
  createWorkDescription: (projectId: string, assigneeId: string, description: string) => Promise<WorkDescription>;
  submitWorkLog: (projectId: string, content: string, files?: File[]) => Promise<WorkLog>;
  triggerApiSync: () => Promise<void>;
  isServerConnected: boolean;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  removeToast: (id: string) => void;
  addProjectMember: (projectId: string, member: Omit<TeamMember, 'id'>) => void;
  removeProjectMember: (projectId: string, memberId: string) => void;
  createProject: (project: Omit<Project, 'id' | 'members'> & { members: Omit<TeamMember, 'id'>[] }) => Project;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-stripe',
    name: 'Stripe Billing & Subscription Engine',
    code: 'PRJ-8812',
    description: 'Implement secure Stripe customer portals, handling webhook listeners, subscription upgrades, and credit adjustments.',
    members: [
      {
        id: 'intern-sanjay',
        name: 'Sanjay Kumar',
        role: 'Frontend Intern',
        email: 'sanjay@stripe.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
      },
      {
        id: 'intern-rohit',
        name: 'Rohit Verma',
        role: 'Backend Intern',
        email: 'rohit@stripe.com',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80'
      }
    ],
    authorityName: 'Sarah Jenkins (VP of Product)'
  },
  {
    id: 'proj-linear',
    name: 'Linear Core Sync Architecture',
    code: 'PRJ-4091',
    description: 'Refactoring task management synchronization pipelines using WebSockets and conflict-free replicated data types.',
    members: [
      {
        id: 'intern-aditi',
        name: 'Aditi Sharma',
        role: 'Fullstack Intern',
        email: 'aditi@linear.app',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80'
      },
      {
        id: 'intern-sanjay',
        name: 'Sanjay Kumar',
        role: 'Frontend Intern',
        email: 'sanjay@linear.app',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
      }
    ],
    authorityName: 'Alex Rivers (Staff Systems Architect)'
  },
  {
    id: 'proj-notion',
    name: 'Notion Block Editor Refactoring',
    code: 'PRJ-1029',
    description: 'Enhance WYSIWYG block rendering speeds and performance. Build customizable templates and drag-and-drop mechanics.',
    members: [
      {
        id: 'intern-sanjay',
        name: 'Sanjay Kumar',
        role: 'Frontend Intern',
        email: 'sanjay@notion.so',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'
      },
      {
        id: 'intern-aditi',
        name: 'Aditi Sharma',
        role: 'UI/UX Designer',
        email: 'aditi@notion.so',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80'
      },
      {
        id: 'intern-rohit',
        name: 'Rohit Verma',
        role: 'DevOps Intern',
        email: 'rohit@notion.so',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80'
      }
    ],
    authorityName: 'Sarah Jenkins (VP of Product)'
  }
];

const INITIAL_DESCRIPTIONS: WorkDescription[] = [
  {
    id: 'desc-1',
    projectId: 'proj-stripe',
    authorityId: 'auth-jenkins',
    assigneeId: 'intern-sanjay',
    description: '### Sprint Objective\nComplete the integration of Stripe Customer Portal with direct sync to our billing schema.\n\n### Core Tasks\n1. Set up an Express endpoint `/api/billing/portal` mapping user tokens to Customer Portal sessions.\n2. Handle `customer.subscription.updated` and `invoice.payment_succeeded` webhook operations with absolute consistency.\n3. Implement proper client-side loading spinners and error screens.\n\n### Expectations\nEnsure all DB updates are wrapped in clean transactions. Write unit tests for the webhook handler. Submit a draft log listing endpoint responses, DB schemas modified, and test results.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'desc-2',
    projectId: 'proj-linear',
    authorityId: 'auth-rivers',
    assigneeId: 'intern-aditi',
    description: '### Sync Architecture Objective\nImplement conflict resolution handlers on the WebSocket channel.\n\n### Core Tasks\n- Hook up a last-write-wins CRDT strategy for updating card states.\n- Create a mock latency network testing suite inside `/test/network.ts`.\n- Write proper logs showing concurrent resolution outputs.\n\n### Requirements\nLogs should explicitly show how conflicts are resolved when two users drag cards simultaneously.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_LOGS: WorkLog[] = [
  {
    id: 'log-1',
    projectId: 'proj-stripe',
    internId: 'intern-sanjay',
    content: 'Completed task 1 and 2. I have added the backend routing in `server.js` matching client customer logins to Stripe portal URLs. Also added Supabase DB listeners for user plan mapping. Webhook signatures are validated using standard credentials. All webhook handlers run successfully. Added unit tests for payment success and billing updates. 100% of tests are passing.',
    uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    descriptionId: 'desc-1',
    review: {
      id: 'rev-1',
      logId: 'log-1',
      score: 92,
      feedback: 'Outstanding log submission. Sanjay has covered all components including webhook routing, database hooks, signature verification, and full test suites. Very structured and detailed developer update.',
      strengths: ['Addressed both backend routing and Supabase integration tasks.', 'Validating webhook signatures properly.', 'Included unit tests with 100% success rate.'],
      weaknesses: ['Did not document visual feedback states or client-side loader integration in detail.'],
      suggestions: ['Add a brief mention of frontend loading skeletons for user portal transitions in the next sprint.'],
      confidence: 0.98,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  {
    id: 'log-2',
    projectId: 'proj-linear',
    internId: 'intern-aditi',
    content: 'Started conflict resolver setups. Created websocket client scripts. Resolved index errors.',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    descriptionId: 'desc-2',
    review: {
      id: 'rev-2',
      logId: 'log-2',
      score: 42,
      feedback: 'The log is extremely short and does not address core requirements. Missing the concurrent resolution details, test suites, and latency resolution outputs requested by the architect.',
      strengths: ['Initiated websocket script configurations.'],
      weaknesses: ['Very brief summary with minimal details (under 15 words).', 'Completely skipped the CRDT synchronization mechanics.', 'No mock network test runs or resolution logs provided.'],
      suggestions: ['Expand log files to include file modifications, terminal logs, and resolved issues.', 'Review the sprint requirements and document testing workflows explicitly.'],
      confidence: 0.95,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
];

// Helper mock AI reviewer
const generateMockAIReview = (workDesc: string, logContent: string, files: File[] = []): AIReview => {
  const words = logContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasFiles = files.length > 0;

  if (wordCount < 10 && !hasFiles) {
    return {
      id: `rev-mock-${Date.now()}`,
      logId: '',
      score: 35 + Math.floor(Math.random() * 15),
      feedback: 'Low-effort submission. The work log is extremely short and does not provide enough technical details or verification output to validate the tasks.',
      strengths: ['Submitted log on time.'],
      weaknesses: ['Log content is under 10 words, lacking technical explanation.', 'No confirmation of test execution or actual feature completion.'],
      suggestions: ['Provide structured lists of files modified.', 'Describe error cases encountered and how they were fixed.'],
      confidence: 0.91,
      createdAt: new Date().toISOString()
    };
  }

  // Look for keywords
  const hasTests = logContent.toLowerCase().includes('test') || logContent.toLowerCase().includes('spec');
  const hasDB = logContent.toLowerCase().includes('db') || logContent.toLowerCase().includes('database') || logContent.toLowerCase().includes('supabase');
  const hasAPI = logContent.toLowerCase().includes('api') || logContent.toLowerCase().includes('endpoint') || logContent.toLowerCase().includes('route');
  
  let score = 75;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (hasTests) {
    score += 8;
    strengths.push('Included details about unit testing and execution verification.');
  } else {
    score -= 5;
    weaknesses.push('No mention of testing or test case updates.');
    suggestions.push('Write unit tests or describe how modifications were manually verified.');
  }

  if (hasDB) {
    score += 5;
    strengths.push('Addressed database integrations and schema hooks.');
  }

  if (hasAPI) {
    score += 5;
    strengths.push('Configured backend routers and endpoint controllers.');
  }
  
  if (hasFiles) {
    score += 15;
    strengths.push('Included source code files for review.');
  }

  if (wordCount > 50 || hasFiles) {
    score += 5;
    if (wordCount > 50) strengths.push('Detailed log explanation outlining multiple engineering tasks.');
  } else {
    weaknesses.push('Log description could be more comprehensive.');
    suggestions.push('Provide line or file-level metrics or logs from console/tests.');
  }

  score = Math.min(100, Math.max(0, score));

  let feedback = '';
  if (score >= 90) {
    feedback = 'Excellent log details. High consistency with the assigned work description. Solid explanation of database hooks, endpoint wiring, and testing parameters.';
  } else if (score >= 70) {
    feedback = 'Good progress reported. The log addresses the main objectives. However, adding more technical metrics and visual or client validation details would make it even stronger.';
  } else {
    feedback = 'Moderate work reported. The tasks from the work description are only partially addressed. We recommend detailing the synchronization and routing mechanisms further.';
  }

  return {
    id: `rev-mock-${Date.now()}`,
    logId: '',
    score,
    feedback,
    strengths: strengths.length ? strengths : ['Drafted code changes.'],
    weaknesses: weaknesses.length ? weaknesses : ['Could provide structural details of the backend handlers.'],
    suggestions: suggestions.length ? suggestions : ['Detail next steps and future features.'],
    confidence: 0.90 + Math.random() * 0.09,
    createdAt: new Date().toISOString()
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem('role') as Role) || 'none';
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return localStorage.getItem('selectedProjectId') || DEFAULT_PROJECTS[0].id;
  });

  const [workDescriptions, setWorkDescriptions] = useState<WorkDescription[]>(() => {
    const saved = localStorage.getItem('workDescriptions');
    return saved ? JSON.parse(saved) : INITIAL_DESCRIPTIONS;
  });

  const [workLogs, setWorkLogs] = useState<WorkLog[]>(() => {
    const saved = localStorage.getItem('workLogs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast functions
  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Theme is forced to light
  const theme = 'light';
  const setTheme = (t: Theme) => {};
  
  // Ensure DOM is always light
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Sync role to storage
  const setRole = (r: Role) => {
    setRoleState(r);
    localStorage.setItem('role', r);
    addToast(`Logged in as ${r.charAt(0).toUpperCase() + r.slice(1)}`, 'success');
  };

  // Sync projects details to local storage with quota protection
  useEffect(() => {
    try {
      localStorage.setItem('selectedProjectId', selectedProjectId);
    } catch (e) {
      console.warn('Failed to save selectedProjectId to localStorage:', e);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    try {
      localStorage.setItem('workDescriptions', JSON.stringify(workDescriptions));
    } catch (e) {
      console.warn('Failed to save workDescriptions to localStorage:', e);
    }
  }, [workDescriptions]);

  useEffect(() => {
    try {
      // Keep latest 50 logs in local storage cache to avoid quota overflow
      const cappedLogs = workLogs.slice(-50);
      localStorage.setItem('workLogs', JSON.stringify(cappedLogs));
    } catch (e) {
      console.warn('localStorage quota exceeded while saving workLogs:', e);
    }
  }, [workLogs]);

  // Ping backend server to verify connection
  const checkServerConnection = async () => {
    try {
      const res = await fetch('/api/', { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        setIsServerConnected(true);
      } else {
        setIsServerConnected(false);
      }
    } catch {
      setIsServerConnected(false);
    }
  };

  useEffect(() => {
    checkServerConnection();
    // Re-check periodically
    const interval = setInterval(checkServerConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial data from server if connected
  const triggerApiSync = useCallback(async () => {
    if (!isServerConnected) return;
    setIsLoading(true);
    try {
      // 1. Fetch latest work description for each project (clear mock descriptions to avoid duplicates)
      const fetchedDescs: WorkDescription[] = workDescriptions.filter(d => !d.id.startsWith('desc-'));
      for (const proj of projects) {
        try {
          const res = await fetch(`/api/work-descriptions/${proj.id}`);
          if (res.ok) {
            const data = await res.json();
            const idx = fetchedDescs.findIndex(d => d.id === data.id);
            if (idx >= 0) {
              fetchedDescs[idx] = data;
            } else {
              fetchedDescs.push(data);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setWorkDescriptions(fetchedDescs);

      // 2. Fetch logs for current selected project
      try {
        const targetProj = projects.find(p => p.id === selectedProjectId);
        const projAuthorityId = targetProj?.authorityName?.includes('Rivers') ? 'auth-rivers' : 'auth-jenkins';
        const res = await fetch(`/api/logs/${selectedProjectId}?authorityId=${projAuthorityId}`);
        if (res.ok) {
          const logsData = await res.json();
          // For each log, fetch its review if not already embedded
          const fullLogs = await Promise.all(
            logsData.map(async (log: any) => {
              let review = log.review || null;
              if (!review) {
                try {
                  const revRes = await fetch(`/api/logs/${log.id}/review`);
                  if (revRes.ok) {
                    review = await revRes.json();
                  }
                } catch {}
              }

              // Build AIReview purely from real server data — no mock blending
              let mappedReview: AIReview | undefined = undefined;
              if (review && review.score !== null) {
                mappedReview = {
                  id: review.id || `rev-${log.id}`,
                  logId: review.logId || log.id,
                  score: review.score,
                  feedback: review.feedback || '',
                  strengths: review.strengths || [],
                  weaknesses: review.weaknesses || [],
                  suggestions: review.suggestions || [],
                  missing: review.missing || [],
                  managerSummary: review.managerSummary || undefined,
                  riskLevel: review.riskLevel || undefined,
                  recommendation: review.recommendation || undefined,
                  speech_text: review.speechText || review.speech_text || review.feedback || undefined,
                  confidence: 1.0,
                  createdAt: review.createdAt || new Date().toISOString()
                };
              }
              
              return {
                id: log.id,
                projectId: log.projectId,
                internId: log.internId,
                content: log.content,
                fileUrl: log.fileUrl,
                uploadedAt: log.uploadedAt,
                descriptionId: log.descriptionId,
                review: mappedReview
              };
            })
          );

          setWorkLogs(prev => {
            // Filter out both selected project logs and mock logs to avoid duplication
            const filtered = prev.filter(l => l.projectId !== selectedProjectId && !l.id.startsWith('log-'));
            return [...filtered, ...fullLogs];
          });
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isServerConnected, selectedProjectId, projects, workDescriptions]);

  useEffect(() => {
    if (isServerConnected) {
      triggerApiSync();
    }
  }, [isServerConnected, selectedProjectId, triggerApiSync]);

  // Create Work Description mutation
  const createWorkDescription = async (projectId: string, assigneeId: string, description: string): Promise<WorkDescription> => {
    setIsLoading(true);
    const targetProject = projects.find(p => p.id === projectId);
    const existingDesc = workDescriptions.find(d => d.projectId === projectId);
    const activeAuthorityId = existingDesc?.authorityId || (targetProject?.authorityName?.includes('Rivers') ? 'auth-rivers' : 'auth-jenkins');

    const newDescLocal: WorkDescription = {
      id: `desc-${Date.now()}`,
      projectId,
      authorityId: activeAuthorityId,
      assigneeId,
      description,
      createdAt: new Date().toISOString()
    };

    try {
      if (isServerConnected) {
        try {
          const res = await fetch('/api/work-descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              authorityId: activeAuthorityId,
              description,
              assigneeId // Passed, though ignored by default server schema.
            })
          });
          if (res.ok) {
            const data = await res.json();
            // Embed the local assigneeId in the returned data from server so UI state stays correct
            const enrichedData = { ...data, assigneeId };
            setWorkDescriptions(prev => [enrichedData, ...prev]);
            addToast('Work description published to server!', 'success');
            return enrichedData;
          }
        } catch (err) {
          console.error('Failed to publish description to server, using local storage fallback.', err);
        }
      }

      // Local-only Fallback
      setWorkDescriptions(prev => [newDescLocal, ...prev]);
      addToast('Work description published locally', 'info');
      return newDescLocal;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Work Log mutation – sends real multipart/form-data so backend multer
  // receives actual file buffers which are passed to the Gemini AI reviewer.
  const submitWorkLog = async (projectId: string, content: string, files?: File[]): Promise<WorkLog> => {
    setIsLoading(true);
    const targetProject = projects.find(p => p.id === projectId);
    const currentDesc = workDescriptions.find(d => d.projectId === projectId);
    const activeInternId = currentDesc?.assigneeId || targetProject?.members?.[0]?.id || 'intern-sanjay';
    const primaryFileName = files && files.length > 0 ? files[0].name : undefined;

    try {
      if (isServerConnected) {
        try {
          // Build multipart/form-data – backend uses multer('files') to parse uploaded code files
          const formData = new FormData();
          formData.append('projectId', projectId);
          formData.append('internId', activeInternId);
          if (content) formData.append('content', content);
          if (files && files.length > 0) {
            files.forEach(file => formData.append('files', file));
          }

        const res = await fetch('/api/logs', {
          method: 'POST',
          // Do NOT set Content-Type header – browser sets it with correct multipart boundary
          body: formData
        });

        if (res.ok) {
          const logData = await res.json();

          // Map API review to local AIReview shape — use real data only, no mock blending
          const apiReview = logData.review;
          let detailedReview: AIReview | undefined = undefined;
          if (apiReview && apiReview.score !== null && apiReview.score !== undefined) {
            detailedReview = {
              id: apiReview.id || `rev-${logData.id}`,
              logId: apiReview.logId || logData.id,
              score: apiReview.score,
              feedback: apiReview.feedback || '',
              strengths: apiReview.strengths || [],
              weaknesses: apiReview.weaknesses || [],
              suggestions: apiReview.suggestions || [],
              missing: apiReview.missing || [],
              managerSummary: apiReview.managerSummary || undefined,
              riskLevel: apiReview.riskLevel || undefined,
              recommendation: apiReview.recommendation || undefined,
              speech_text: apiReview.speechText || apiReview.speech_text || apiReview.feedback || undefined,
              confidence: 1.0,
              createdAt: apiReview.createdAt || new Date().toISOString()
            };
          }

          const completeLog: WorkLog = {
            id: logData.id,
            projectId: logData.projectId,
            internId: logData.internId,
            content: logData.content,
            fileUrl: logData.fileUrl,
            fileName: primaryFileName,
            uploadedAt: logData.uploadedAt,
            descriptionId: logData.descriptionId,
            review: detailedReview
          };

          setWorkLogs(prev => [completeLog, ...prev]);
          addToast('Work log submitted and reviewed by AI!', 'success');
          setIsLoading(false);
          return completeLog;
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.error('Server returned error:', res.status, errBody);
          addToast(`Server error: ${errBody.error || res.statusText}`, 'error');
        }
      } catch (err) {
        console.error('Failed to submit log to server, using local evaluation.', err);
      }
    }

    // Local-only fallback (server offline) — generate offline review
    const newLogLocalId = `log-${Date.now()}`;
    const offlineReview = generateMockAIReview(currentDesc?.description || '', content, files);
    offlineReview.logId = newLogLocalId;

    const newLogLocal: WorkLog = {
      id: newLogLocalId,
      projectId,
      internId: activeInternId,
      content,
      fileName: primaryFileName,
      uploadedAt: new Date().toISOString(),
      descriptionId: currentDesc?.id,
      review: offlineReview
    };

    setWorkLogs(prev => [newLogLocal, ...prev]);
    addToast('Evaluated locally (server offline)', 'warning');
    return newLogLocal;
  } finally {
    setIsLoading(false);
  }
};

  const addProjectMember = (projectId: string, member: Omit<TeamMember, 'id'>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newMember: TeamMember = {
          ...member,
          id: `member-${Date.now()}`
        };
        return {
          ...p,
          members: [...p.members, newMember]
        };
      }
      return p;
    }));
    addToast('Team member added successfully!', 'success');
  };

  const removeProjectMember = (projectId: string, memberId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          members: p.members.filter(m => m.id !== memberId)
        };
      }
      return p;
    }));
    addToast('Team member removed successfully!', 'info');
  };

  const createProject = (project: Omit<Project, 'id' | 'members'> & { members: Omit<TeamMember, 'id'>[] }) => {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      members: project.members.map((m, idx) => ({
        ...m,
        id: `member-${Date.now()}-${idx}`
      }))
    };
    setProjects(prev => [...prev, newProject]);
    addToast(`Project "${newProject.name}" created successfully!`, 'success');
    return newProject;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        role,
        setRole,
        projects,
        selectedProjectId,
        setSelectedProjectId,
        workDescriptions,
        workLogs,
        isLoading,
        createWorkDescription,
        submitWorkLog,
        triggerApiSync,
        isServerConnected,
        toasts,
        addToast,
        removeToast,
        addProjectMember,
        removeProjectMember,
        createProject
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
