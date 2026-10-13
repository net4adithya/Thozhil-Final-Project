import React, { useState } from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Project {
  id: string;
  title: string;
  description: string;
  logsSubmitted: number;
  avgScore: number;
  members: { name: string; avatar: string; role: string }[];
  isCurrent?: boolean;
}

export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  email: string;
  avatar: string;
}

export interface SubmissionLog {
  id: string;
  internName: string;
  internAvatar: string;
  role: string;
  timestamp: string;
  logSnippet: string;
  aiScore: number;
  project: string;
}

export interface TimelineTask {
  id: string;
  phaseName: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  completion: number;
  startWeek: number; // 1 to 6
  durationWeeks: number;
  assignees: { name: string; avatar: string }[];
}

export interface TemplatePreset {
  name: string;
  title: string;
  deliverables: string;
}

// ============================================================================
// Initial Mock Data
// ============================================================================

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-8812',
    title: 'Stripe Billing & Subscription Engine',
    description: 'Revamping core payment workflows, webhooks integration, and auto-tier upgrade logic for enterprise tier subscribers.',
    logsSubmitted: 42,
    avgScore: 94,
    members: [
      { name: 'Alex Smith', avatar: 'AS', role: 'Full-Stack Intern' },
      { name: 'Maya Lin', avatar: 'ML', role: 'Backend Intern' },
      { name: 'David Kim', avatar: 'DK', role: 'Frontend Intern' },
    ],
  },
  {
    id: 'PRJ-4091',
    title: 'Linear Core Sync Architecture',
    description: 'Bi-directional background syncing engine connecting issue tracking, sprint milestones, and automated commit hooks.',
    logsSubmitted: 28,
    avgScore: 91,
    members: [
      { name: 'Sarah Jenkins', avatar: 'SJ', role: 'Lead Architect' },
      { name: 'Alex Smith', avatar: 'AS', role: 'Full-Stack Intern' },
    ],
  },
  {
    id: 'PRJ-1029',
    title: 'Notion Block Editor Refactoring',
    description: 'Modular rich-text block rendering architecture with custom markdown extensions and canvas-based real-time collaboration.',
    logsSubmitted: 35,
    avgScore: 89,
    members: [
      { name: 'David Kim', avatar: 'DK', role: 'Frontend Intern' },
      { name: 'Maya Lin', avatar: 'ML', role: 'Backend Intern' },
    ],
  },
];

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    fullName: 'Alex Smith',
    role: 'Senior Full-Stack Intern',
    email: 'alex.smith@thozhil.com',
    avatar: 'AS',
  },
  {
    id: 'mem-2',
    fullName: 'Maya Lin',
    role: 'Backend Engineering Intern',
    email: 'maya.lin@thozhil.com',
    avatar: 'ML',
  },
  {
    id: 'mem-3',
    fullName: 'David Kim',
    role: 'Frontend Specialist Intern',
    email: 'david.kim@thozhil.com',
    avatar: 'DK',
  },
  {
    id: 'mem-4',
    fullName: 'Sarah Jenkins',
    role: 'Lead Architect & Mentor',
    email: 'sarah.j@thozhil.com',
    avatar: 'SJ',
  },
];

const INITIAL_SUBMISSIONS: SubmissionLog[] = [
  {
    id: 'sub-1',
    internName: 'Alex Smith',
    internAvatar: 'AS',
    role: 'Full-Stack Intern',
    timestamp: '10 mins ago',
    logSnippet: 'Implemented Stripe webhook signature validation with HMAC-SHA256 and exponential backoff retry logic. Resolved idempotency key duplication issue.',
    aiScore: 96,
    project: 'PRJ-8812',
  },
  {
    id: 'sub-2',
    internName: 'Maya Lin',
    internAvatar: 'ML',
    role: 'Backend Intern',
    timestamp: '45 mins ago',
    logSnippet: 'Added Redis cache layer for user session state & token validation middleware. Decreased response latency by 64ms across auth routes.',
    aiScore: 92,
    project: 'PRJ-8812',
  },
  {
    id: 'sub-3',
    internName: 'David Kim',
    internAvatar: 'DK',
    role: 'Frontend Intern',
    timestamp: '2 hours ago',
    logSnippet: 'Created dark-mode ready custom components for Gantt roadmap timeline visualization with accessible ARIA labels and micro-interactions.',
    aiScore: 88,
    project: 'PRJ-8812',
  },
  {
    id: 'sub-4',
    internName: 'Chen Wei',
    internAvatar: 'CW',
    role: 'DevOps Intern',
    timestamp: '4 hours ago',
    logSnippet: 'Optimized PostgreSQL index query on subscriptions table for sub-second retrieval times under peak load simulation.',
    aiScore: 94,
    project: 'PRJ-4091',
  },
];

const INITIAL_TIMELINE_TASKS: TimelineTask[] = [
  {
    id: 'task-1',
    phaseName: 'Phase 1: Architecture & DB Schema',
    status: 'Completed',
    completion: 100,
    startWeek: 1,
    durationWeeks: 2,
    assignees: [{ name: 'Sarah Jenkins', avatar: 'SJ' }, { name: 'Alex Smith', avatar: 'AS' }],
  },
  {
    id: 'task-2',
    phaseName: 'Phase 2: Stripe SDK & Webhook Core',
    status: 'In Progress',
    completion: 75,
    startWeek: 2,
    durationWeeks: 3,
    assignees: [{ name: 'Alex Smith', avatar: 'AS' }, { name: 'Maya Lin', avatar: 'ML' }],
  },
  {
    id: 'task-3',
    phaseName: 'Phase 3: Subscription Lifecycle & Retry',
    status: 'In Progress',
    completion: 40,
    startWeek: 3,
    durationWeeks: 2,
    assignees: [{ name: 'Maya Lin', avatar: 'ML' }],
  },
  {
    id: 'task-4',
    phaseName: 'Phase 4: Customer Portal UI & React Hooks',
    status: 'Planned',
    completion: 10,
    startWeek: 4,
    durationWeeks: 2,
    assignees: [{ name: 'David Kim', avatar: 'DK' }],
  },
  {
    id: 'task-5',
    phaseName: 'Phase 5: Automated E2E & Load Tests',
    status: 'Planned',
    completion: 0,
    startWeek: 5,
    durationWeeks: 2,
    assignees: [{ name: 'Alex Smith', avatar: 'AS' }, { name: 'David Kim', avatar: 'DK' }],
  },
];

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    name: 'Stripe Webhooks Template',
    title: 'Implement Webhook Verification & Event Handler',
    deliverables: '### Deliverables & Acceptance Criteria\n- [ ] Add HMAC-SHA256 signature verification endpoint\n- [ ] Implement exponential backoff retry handler\n- [ ] Store processed event IDs in Redis idempotency set\n- [ ] Include unit tests covering invalid secret scenarios',
  },
  {
    name: 'OAuth2 Auth Flow',
    title: 'Refactor OAuth2 Refresh Token Rotation',
    deliverables: '### Deliverables & Acceptance Criteria\n- [ ] Implement automatic silent token refresh before expiration\n- [ ] Store encrypted refresh tokens in secure HttpOnly cookies\n- [ ] Add revoke token endpoint on manual user logout',
  },
  {
    name: 'Redis Caching',
    title: 'Cache Invalidation Engine for User Profiles',
    deliverables: '### Deliverables & Acceptance Criteria\n- [ ] Add cache hit/miss telemetry logging\n- [ ] Implement write-through cache pattern for user profile updates\n- [ ] Configure TTL expiration default to 15 minutes',
  },
];

// ============================================================================
// Main Component: AuthorityDashboard
// ============================================================================

export const AuthorityDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'timeline' | 'backlog' | 'submissions' | 'projects' | 'team'>('timeline');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-8812');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [submissions] = useState<SubmissionLog[]>(INITIAL_SUBMISSIONS);
  const [timelineTasks] = useState<TimelineTask[]>(INITIAL_TIMELINE_TASKS);

  // Backlog Form State
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskAssignee, setTaskAssignee] = useState<string>('Alex Smith');
  const [taskDeliverables, setTaskDeliverables] = useState<string>('');
  const [currentWorkDesc, setCurrentWorkDesc] = useState<{
    objective: string;
    coreTasks: string[];
    expectations: string[];
    assignees: string[];
  }>({
    objective: 'Sprint #14: Implement resilient webhook processing and tier upgrades for Stripe subscriptions.',
    coreTasks: [
      'Stripe HMAC signature validation endpoint',
      'Idempotent webhook queue with Redis',
      'React subscription management interface',
    ],
    expectations: [
      'Maintain 95%+ test coverage across billing utilities',
      'Sub-100ms response time for webhook acknowledgments',
    ],
    assignees: ['Alex Smith', 'Maya Lin', 'David Kim'],
  });

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Derived current project
  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Handlers
  const handleApplyTemplate = (preset: TemplatePreset) => {
    setTaskTitle(preset.title);
    setTaskDeliverables(preset.deliverables);
    showToast(`Applied preset: ${preset.name}`);
  };

  const handlePublishBacklog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      showToast('Please enter a task title before publishing.');
      return;
    }
    setCurrentWorkDesc((prev) => ({
      ...prev,
      objective: `Sprint #15: ${taskTitle}`,
      coreTasks: [taskTitle, ...prev.coreTasks.slice(0, 2)],
    }));
    setTaskTitle('');
    setTaskDeliverables('');
    showToast('Published new Sprint Backlog task successfully!');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberRole.trim() || !newMemberEmail.trim()) {
      showToast('Please fill in all fields for the new member.');
      return;
    }

    const initials = newMemberName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      fullName: newMemberName,
      role: newMemberRole,
      email: newMemberEmail,
      avatar: initials || 'TM',
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
    showToast(`Added ${newMember.fullName} to team group!`);
  };

  const handleDeleteMember = (id: string, name: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    showToast(`Removed ${name} from team directory.`);
  };

  const handleSwitchProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    showToast(`Switched active project focus to ${projectId}`);
  };

  const handleCreateNewProject = () => {
    const newId = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProj: Project = {
      id: newId,
      title: 'New Service Integration Module',
      description: 'Newly initialized microservice project for automated AI feedback and analytics delivery.',
      logsSubmitted: 0,
      avgScore: 100,
      members: [{ name: 'Jane Doe', avatar: 'JD', role: 'Authority' }],
    };
    setProjects((prev) => [...prev, newProj]);
    setSelectedProjectId(newId);
    showToast(`Created and selected new project ${newId}`);
  };

  // Frequency Data for Submissions Chart
  const submissionFreq = [
    { day: 'Mon', count: 18, heightPct: 60 },
    { day: 'Tue', count: 24, heightPct: 80 },
    { day: 'Wed', count: 32, heightPct: 100, isPeak: true },
    { day: 'Thu', count: 28, heightPct: 88 },
    { day: 'Fri', count: 21, heightPct: 70 },
    { day: 'Sat', count: 12, heightPct: 40 },
    { day: 'Sun', count: 8, heightPct: 26 },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex flex-col md:flex-row antialiased selection:bg-[#0070eb] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0058bc] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
          GLOBAL LAYOUT ELEMENT 1: SIDEBAR NAVIGATION
          ===================================================================== */}
      <aside className="w-full md:w-64 bg-white border-r border-[#e0e3e5] flex flex-col justify-between p-5 shrink-0 shadow-sm">
        <div className="space-y-6">
          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#0058bc] text-white shadow-sm'
                  : 'text-[#414755] hover:bg-[#f2f4f6] hover:text-[#0058bc]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'submissions'
                  ? 'bg-[#0058bc] text-white shadow-sm'
                  : 'text-[#414755] hover:bg-[#f2f4f6] hover:text-[#0058bc]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">history</span>
              <span>Log History</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#0058bc] text-white shadow-sm'
                  : 'text-[#414755] hover:bg-[#f2f4f6] hover:text-[#0058bc]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">folder</span>
              <span>Projects Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'team'
                  ? 'bg-[#0058bc] text-white shadow-sm'
                  : 'text-[#414755] hover:bg-[#f2f4f6] hover:text-[#0058bc]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">group</span>
              <span>Team Directory</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User Profile Section & Logout */}
        <div className="pt-6 border-t border-[#f2f4f6] space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#0058bc] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-[#d0e4ff]">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#191c1e] truncate">Jane Doe</div>
              <div className="text-xs text-[#414755] font-medium truncate">Authority Lead</div>
            </div>
          </div>

          <button
            onClick={() => showToast('Logged out of Authority Panel.')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* =====================================================================
            GLOBAL LAYOUT ELEMENT 2: TOP HEADER BAR
            ===================================================================== */}
        <header className="bg-white border-b border-[#e0e3e5] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          {/* Active Project Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-[#414755] tracking-wider hidden md:inline">Project Focus:</span>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => handleSwitchProject(e.target.value)}
                className="bg-[#f2f4f6] text-[#191c1e] font-bold text-sm rounded-xl px-4 py-2.5 border border-[#c1c6d7] focus:outline-none focus:ring-2 focus:ring-[#0058bc] cursor-pointer pr-10 shadow-xs"
              >
                <option value="PRJ-8812">PRJ-8812 : Stripe Billing & Subscription Engine</option>
                <option value="PRJ-4091">PRJ-4091 : Linear Core Sync Architecture</option>
                <option value="PRJ-1029">PRJ-1029 : Notion Block Editor Refactoring</option>
              </select>
            </div>
          </div>

          {/* Right Header Status Indicators */}
          <div className="flex items-center gap-5">
            {/* Green Live Sync Indicator */}
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-800">Live Sync</span>
            </div>

            {/* Team Size Counter */}
            <div className="flex items-center gap-2 bg-[#f2f4f6] px-3.5 py-1.5 rounded-full border border-[#e0e3e5] text-xs font-bold text-[#414755]">
              <span className="material-symbols-outlined text-sm text-[#0058bc]">group</span>
              <span>Team size: {teamMembers.length} Members</span>
            </div>
          </div>
        </header>

        {/* Main Body Layout */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* =====================================================================
              GLOBAL LAYOUT ELEMENT 3: MAIN PAGE HEADER
              ===================================================================== */}
          <div>
            <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">Authority Panel</h1>
            <p className="text-sm font-semibold text-[#0058bc] mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">turned_in</span>
              <span>Active Project: {currentProject.id} - {currentProject.title}</span>
            </p>
          </div>

          {/* =====================================================================
              GLOBAL LAYOUT ELEMENT 4: KPI CARDS
              ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Submitted Logs */}
            <div className="bg-white rounded-2xl p-6 border border-[#f2f4f6] shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex justify-between items-center text-[#414755]">
                <span className="text-xs font-bold uppercase tracking-wider">Submitted Logs</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0058bc] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">article</span>
                </div>
              </div>
              <div className="text-3xl font-black text-[#191c1e]">{currentProject.logsSubmitted + 106}</div>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>+12.4% vs last week</span>
              </div>
            </div>

            {/* Card 2: Average Score */}
            <div className="bg-white rounded-2xl p-6 border border-[#f2f4f6] shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex justify-between items-center text-[#414755]">
                <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600">{currentProject.avgScore}%</div>
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2.5 py-0.5 rounded-md border border-emerald-200">
                Optimal AI Quality Target
              </div>
            </div>

            {/* Card 3: Pending Review */}
            <div className="bg-white rounded-2xl p-6 border border-[#f2f4f6] shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex justify-between items-center text-[#414755]">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">pending_actions</span>
                </div>
              </div>
              <div className="text-3xl font-black text-[#191c1e]">12</div>
              <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>Requires Authority sign-off</span>
              </div>
            </div>

            {/* Card 4: Completion Rate */}
            <div className="bg-white rounded-2xl p-6 border border-[#f2f4f6] shadow-sm hover:shadow-md transition-shadow space-y-2">
              <div className="flex justify-between items-center text-[#414755]">
                <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">verified</span>
                </div>
              </div>
              <div className="text-3xl font-black text-[#191c1e]">88.5%</div>
              <div className="w-full bg-[#f2f4f6] h-2 rounded-full overflow-hidden mt-1">
                <div className="bg-[#0058bc] h-full rounded-full w-[88.5%]"></div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              GLOBAL LAYOUT ELEMENT 5: TABBED NAVIGATION MENU
              ===================================================================== */}
          <div className="border-b border-[#e0e3e5] pb-1">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'timeline'
                    ? 'bg-[#0058bc] text-white shadow-md'
                    : 'text-[#414755] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">view_timeline</span>
                <span>Timeline Board</span>
              </button>

              <button
                onClick={() => setActiveTab('backlog')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'backlog'
                    ? 'bg-[#0058bc] text-white shadow-md'
                    : 'text-[#414755] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                <span>Backlog & Sprints</span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'submissions'
                    ? 'bg-[#0058bc] text-white shadow-md'
                    : 'text-[#414755] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">dynamic_feed</span>
                <span>Submissions Feed</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'projects'
                    ? 'bg-[#0058bc] text-white shadow-md'
                    : 'text-[#414755] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">folder_open</span>
                <span>Projects Hub</span>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'team'
                    ? 'bg-[#0058bc] text-white shadow-md'
                    : 'text-[#414755] hover:text-[#191c1e] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">group</span>
                <span>Team Directory</span>
              </button>
            </div>
          </div>

          {/* =====================================================================
              TAB CONTENTS (Rendered based on activeTab state)
              ===================================================================== */}

          {/* -------------------------------------------------------------------
              TAB 1: TIMELINE BOARD
              ------------------------------------------------------------------- */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#f2f4f6] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">route</span>
                    <span>Sprint Roadmap Timeline</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Multi-week milestone gantt mapping & assignee tracking.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">Completed</span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800">In Progress</span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">Planned</span>
                </div>
              </div>

              {/* Visual Gantt Chart Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[768px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e0e3e5] text-xs font-bold text-[#414755] uppercase tracking-wider bg-[#f9fafb]">
                      <th className="py-3 px-4 w-1/3">Phase / Task Name</th>
                      <th className="py-3 px-2 w-1/12 text-center">Status</th>
                      <th className="py-3 px-4 w-5/12 text-center">Weeks 1 to 6 Roadmap Visual</th>
                      <th className="py-3 px-4 w-2/12 text-right">Assignees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2f4f6] text-sm font-medium">
                    {timelineTasks.map((task) => {
                      // Semantic badge color
                      let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                      let barColorClass = 'bg-slate-400';
                      if (task.status === 'Completed') {
                        statusBadgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        barColorClass = 'bg-emerald-500';
                      } else if (task.status === 'In Progress') {
                        statusBadgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                        barColorClass = 'bg-[#0058bc]';
                      }

                      // Gantt positioning math: 6 weeks total
                      const leftPct = ((task.startWeek - 1) / 6) * 100;
                      const widthPct = (task.durationWeeks / 6) * 100;

                      return (
                        <tr key={task.id} className="hover:bg-[#f7f9fb] transition-colors">
                          {/* Phase name & progress percentage */}
                          <td className="py-4 px-4 font-bold text-[#191c1e]">
                            <div>{task.phaseName}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="w-32 bg-[#e0e3e5] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColorClass}`}
                                  style={{ width: `${task.completion}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-[#414755] font-semibold">{task.completion}%</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-2 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                              {task.status}
                            </span>
                          </td>

                          {/* Gantt Bar Visualization across Week 1 to Week 6 */}
                          <td className="py-4 px-4 relative">
                            <div className="w-full bg-[#f2f4f6] h-8 rounded-lg relative overflow-hidden flex items-center border border-[#e0e3e5]">
                              {/* Week grid lines */}
                              <div className="absolute inset-0 grid grid-cols-6 pointer-events-none divide-x divide-[#e0e3e5]/60 text-[10px] text-gray-400 font-bold items-center px-1">
                                <div>W1</div>
                                <div>W2</div>
                                <div>W3</div>
                                <div>W4</div>
                                <div>W5</div>
                                <div>W6</div>
                              </div>

                              {/* Horizontal Gantt Bar */}
                              <div
                                className={`absolute h-6 rounded-md ${barColorClass} opacity-90 shadow-xs flex items-center justify-center text-[10px] font-extrabold text-white px-2 transition-all`}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                              >
                                {task.phaseName.split(':')[0]}
                              </div>
                            </div>
                          </td>

                          {/* Assignee Column */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end -space-x-2">
                              {task.assignees.map((a, idx) => (
                                <div
                                  key={idx}
                                  title={a.name}
                                  className="w-8 h-8 rounded-full bg-[#0058bc] text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs"
                                >
                                  {a.avatar}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              TAB 2: BACKLOG & SPRINTS
              ------------------------------------------------------------------- */}
          {activeTab === 'backlog' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Publish Form */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">post_add</span>
                    <span>Draft Sprint Backlog Task</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Create and assign new deliverables directly to interns.</p>
                </div>

                {/* Template Preset Pill Buttons */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-[#414755]">Quick Templates (Click to apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(preset)}
                        className="px-4 py-2 rounded-full bg-blue-50 text-[#0058bc] hover:bg-[#0058bc] hover:text-white border border-blue-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">extension</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Form */}
                <form onSubmit={handlePublishBacklog} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Implement Stripe Webhook HMAC Validation"
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl px-4 py-3 text-sm text-[#191c1e] font-medium outline-none focus:ring-2 focus:ring-[#0058bc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">Assignment Target</label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl px-4 py-3 text-sm text-[#191c1e] font-medium outline-none focus:ring-2 focus:ring-[#0058bc]"
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.fullName}>
                          {m.fullName} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">
                      Deliverables & Requirements (Markdown Supported)
                    </label>
                    <textarea
                      rows={6}
                      value={taskDeliverables}
                      onChange={(e) => setTaskDeliverables(e.target.value)}
                      placeholder="### Key Requirements&#10;- Requirement 1&#10;- Requirement 2"
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl p-4 text-sm text-[#191c1e] font-mono outline-none focus:ring-2 focus:ring-[#0058bc]"
                    ></textarea>
                  </div>

                  {/* Primary Pill-shaped Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#0058bc] text-white font-bold text-sm shadow-md hover:bg-[#004493] hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    <span>Publish Sprint Backlog</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Current State */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div className="border-b border-[#f2f4f6] pb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">Active Milestone</span>
                  <h2 className="text-2xl font-black text-[#191c1e] mt-1">Current Work Description</h2>
                </div>

                <div className="bg-[#f7f9fb] rounded-xl p-5 border border-[#e0e3e5] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#0058bc] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="material-symbols-outlined text-base">flag</span>
                    <span>{currentWorkDesc.objective}</span>
                  </div>

                  {/* Core Tasks */}
                  <div>
                    <div className="text-xs font-bold uppercase text-[#414755] mb-2">Core Sprint Tasks</div>
                    <ul className="space-y-2">
                      {currentWorkDesc.coreTasks.map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[#191c1e] font-semibold">
                          <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expectations */}
                  <div>
                    <div className="text-xs font-bold uppercase text-[#414755] mb-2">Key Quality Expectations</div>
                    <ul className="space-y-1.5 text-xs text-[#414755]">
                      {currentWorkDesc.expectations.map((exp, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0058bc]"></span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Assigned Interns */}
                  <div className="pt-2 border-t border-[#e0e3e5]">
                    <div className="text-xs font-bold uppercase text-[#414755] mb-2">Assigned Engineers</div>
                    <div className="flex flex-wrap gap-2">
                      {currentWorkDesc.assignees.map((name, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-white border border-[#c1c6d7] text-xs font-bold text-[#191c1e] shadow-xs flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              TAB 3: SUBMISSIONS FEED
              ------------------------------------------------------------------- */}
          {activeTab === 'submissions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Timeline Submissions (Span 2) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">rss_feed</span>
                    <span>Timeline Submissions</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Real-time intern code log submissions & AI quality ratings.</p>
                </div>

                <div className="space-y-4">
                  {submissions.map((sub) => {
                    let scoreBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                    if (sub.aiScore < 90) scoreBg = 'bg-blue-50 text-[#0058bc] border-blue-200';
                    if (sub.aiScore < 80) scoreBg = 'bg-amber-50 text-amber-600 border-amber-200';

                    return (
                      <div
                        key={sub.id}
                        className="bg-[#f7f9fb] rounded-2xl p-5 border border-[#e0e3e5] hover:border-[#0058bc] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#0058bc] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                              {sub.internAvatar}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#191c1e]">{sub.internName}</div>
                              <div className="text-xs text-[#414755] font-medium">{sub.role} • {sub.timestamp}</div>
                            </div>
                          </div>
                          <p className="text-xs text-[#414755] bg-white p-3 rounded-xl border border-[#f2f4f6] leading-relaxed">
                            "{sub.logSnippet}"
                          </p>
                        </div>

                        {/* Large Color-coded AI Score Percentage */}
                        <div className={`px-5 py-4 rounded-2xl border text-center font-black shrink-0 ${scoreBg}`}>
                          <div className="text-xs uppercase tracking-wider font-bold">AI Rating</div>
                          <div className="text-2xl mt-0.5">{sub.aiScore}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Analytics */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">bar_chart</span>
                    <span>Submissions Frequency</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Daily log submission distribution for current sprint.</p>
                </div>

                {/* Bar Chart Container */}
                <div className="pt-8 pb-4 border-b border-[#f2f4f6]">
                  <div className="h-48 flex items-end justify-between gap-2 px-2">
                    {submissionFreq.map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-extrabold text-[#414755] group-hover:text-[#0058bc]">
                          {item.count}
                        </span>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            item.isPeak ? 'bg-[#0058bc] shadow-md' : 'bg-[#d0e4ff] hover:bg-[#0070eb]'
                          }`}
                          style={{ height: `${item.heightPct}%` }}
                        ></div>
                        <span className="text-xs font-bold text-[#414755]">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-[#0058bc] font-semibold space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-base">insights</span>
                    <span>Analytics Insight</span>
                  </div>
                  <p>Peak submission activity recorded on Wednesday (32 logs/day). Average team velocity remains optimal.</p>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              TAB 4: PROJECTS HUB
              ------------------------------------------------------------------- */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#191c1e]">Projects Hub</h2>
                  <p className="text-xs text-[#414755]">Manage active architecture microservices and sprint assignments.</p>
                </div>

                {/* Primary Pill-shaped Button to create project */}
                <button
                  onClick={handleCreateNewProject}
                  className="px-6 py-3 rounded-full bg-[#0058bc] text-white font-bold text-sm shadow-md hover:bg-[#004493] hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  <span>+ Create New Project</span>
                </button>
              </div>

              {/* Grid of Project Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => {
                  const isActive = proj.id === selectedProjectId;

                  return (
                    <div
                      key={proj.id}
                      className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-5 ${
                        isActive
                          ? 'border-[#0058bc] ring-2 ring-[#0058bc]/20 shadow-md'
                          : 'border-[#f2f4f6] shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0058bc] text-xs font-black border border-blue-200">
                            {proj.id}
                          </span>
                          {isActive ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-400">Standby</span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-[#191c1e] leading-snug">{proj.title}</h3>
                        <p className="text-xs text-[#414755] leading-relaxed">{proj.description}</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-[#f2f4f6]">
                        {/* Overlapping Avatars & Stats */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center -space-x-2">
                            {proj.members.map((m, idx) => (
                              <div
                                key={idx}
                                title={m.name}
                                className="w-8 h-8 rounded-full bg-[#0058bc] text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-xs"
                              >
                                {m.avatar}
                              </div>
                            ))}
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-[#191c1e]">{proj.logsSubmitted} Logs</div>
                            <div className="text-[11px] font-extrabold text-emerald-600">{proj.avgScore}% Avg AI Rating</div>
                          </div>
                        </div>

                        {/* Switch Focus Button */}
                        {!isActive ? (
                          <button
                            onClick={() => handleSwitchProject(proj.id)}
                            className="w-full py-2.5 rounded-xl border border-[#0058bc] text-[#0058bc] hover:bg-[#0058bc] hover:text-white font-bold text-xs transition-colors"
                          >
                            Switch Project Focus
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-blue-50 text-[#0058bc] text-center font-bold text-xs border border-blue-200">
                            Currently Focused
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* -------------------------------------------------------------------
              TAB 5: TEAM DIRECTORY
              ------------------------------------------------------------------- */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Members List (Span 2) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">group</span>
                    <span>Team Directory</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Active engineering interns and mentors assigned to workspace.</p>
                </div>

                <div className="divide-y divide-[#f2f4f6]">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="py-4 flex items-center justify-between gap-4 hover:bg-[#f7f9fb] px-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0058bc] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#191c1e]">{member.fullName}</div>
                          <div className="text-xs text-[#414755] font-medium">{member.role}</div>
                          <div className="text-xs text-[#0058bc] font-mono">{member.email}</div>
                        </div>
                      </div>

                      {/* Red Trash Delete Button */}
                      <button
                        onClick={() => handleDeleteMember(member.id, member.fullName)}
                        title="Remove Team Member"
                        className="p-2.5 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Add Member Form */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#f2f4f6] shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0058bc]">person_add</span>
                    <span>Add New Team Member</span>
                  </h2>
                  <p className="text-xs text-[#414755]">Grant authority & intern access privileges.</p>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Jordan Lee"
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl px-4 py-3 text-sm text-[#191c1e] font-medium outline-none focus:ring-2 focus:ring-[#0058bc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">Role Designation</label>
                    <input
                      type="text"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      placeholder="e.g. Frontend Specialist Intern"
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl px-4 py-3 text-sm text-[#191c1e] font-medium outline-none focus:ring-2 focus:ring-[#0058bc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#414755] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="jordan.lee@thozhil.com"
                      className="w-full bg-[#f2f4f6] border border-[#c1c6d7] rounded-xl px-4 py-3 text-sm text-[#191c1e] font-medium outline-none focus:ring-2 focus:ring-[#0058bc]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-[#0058bc] text-white font-bold text-sm shadow-md hover:bg-[#004493] hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span className="material-symbols-outlined text-lg">group_add</span>
                    <span>Add Member To Group</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
