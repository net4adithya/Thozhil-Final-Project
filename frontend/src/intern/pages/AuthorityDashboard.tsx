import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Send, CheckCircle, FileText, BarChart3, Users, Plus, AlertCircle, History, Sparkles, BookOpen, Eye, Calendar, LayoutGrid, Trash2, UserPlus } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useApp } from '../context/InternContext';
import type { WorkLog, TeamMember } from '../context/InternContext';
import { Card, Button, Input, Textarea } from '../components/PremiumComponents';
import { AIReviewCard } from '../components/AIReviewCard';
import { DashboardLayout } from '../components/DashboardLayout';

const TEMPLATES = [
  {
    name: 'Stripe Webhooks Template',
    text: `### Sprint Objective\nComplete the integration of Stripe Customer Portal with direct sync to our billing schema.\n\n### Core Tasks\n1. Set up an Express endpoint \`/api/billing/portal\` mapping user tokens to Customer Portal sessions.\n2. Handle \`customer.subscription.updated\` webhook operations with absolute consistency.\n\n### Expectations\nEnsure all database updates are wrapped in clean transactions. Write unit tests for handlers.`
  },
  {
    name: 'CRDT Sync Template',
    text: `### Sync Architecture Objective\nImplement conflict resolution handlers on the WebSocket channel.\n\n### Core Tasks\n- Hook up a last-write-wins CRDT strategy for updating card states.\n- Create a mock latency network testing suite.\n\n### Requirements\nLogs should show concurrent resolutions when multiple users drag cards.`
  },
  {
    name: 'SaaS Layout Refactor',
    text: `### UI Objective\nOptimize performance metrics for the customer dashboard layouts.\n\n### Core Tasks\n1. Implement React.memo and useMemo blocks on charts rendering data logs.\n2. Add loading skeletons to prevent raw screen content flash.\n3. Verify contrast levels meet Web Content Accessibility Guidelines.`
  }
];

interface GanttTask {
  id: string;
  name: string;
  assignee: string;
  startWeek: number;
  endWeek: number;
  progress: number;
  status: 'Completed' | 'In Progress' | 'Planned';
}

const getGanttTasks = (projectId: string): GanttTask[] => {
  switch (projectId) {
    case 'proj-stripe':
      return [
        { id: '1', name: 'Phase 1: Stripe Portal Endpoints', assignee: 'Sanjay Kumar', startWeek: 1, endWeek: 2, progress: 100, status: 'Completed' },
        { id: '2', name: 'Phase 2: DB Schema & Webhook Receivers', assignee: 'Rohit Verma', startWeek: 2, endWeek: 3, progress: 80, status: 'In Progress' },
        { id: '3', name: 'Phase 3: Webhook Listeners Integration Testing', assignee: 'Rohit Verma', startWeek: 3, endWeek: 4, progress: 0, status: 'Planned' },
        { id: '4', name: 'Phase 4: Client Loader Skeletons & UX Refinements', assignee: 'Sanjay Kumar', startWeek: 3, endWeek: 5, progress: 20, status: 'In Progress' },
        { id: '5', name: 'Phase 5: Automated Testing & E2E Validation', assignee: 'All members', startWeek: 5, endWeek: 6, progress: 0, status: 'Planned' }
      ];
    case 'proj-linear':
      return [
        { id: '1', name: 'Phase 1: WebSocket Client Connection Scripts', assignee: 'Sanjay Kumar', startWeek: 1, endWeek: 2, progress: 90, status: 'In Progress' },
        { id: '2', name: 'Phase 2: CRDT Conflict Resolution Engine', assignee: 'Aditi Sharma', startWeek: 2, endWeek: 4, progress: 40, status: 'In Progress' },
        { id: '3', name: 'Phase 3: Network Testing Suite & Latency Checks', assignee: 'Aditi Sharma', startWeek: 3, endWeek: 5, progress: 0, status: 'Planned' },
        { id: '4', name: 'Phase 4: Multi-User Test Sessions & Resolvers', assignee: 'All members', startWeek: 5, endWeek: 6, progress: 0, status: 'Planned' }
      ];
    case 'proj-notion':
      return [
        { id: '1', name: 'Phase 1: Performance Profiling on WYSIWYG Render', assignee: 'Sanjay Kumar', startWeek: 1, endWeek: 2, progress: 100, status: 'Completed' },
        { id: '2', name: 'Phase 2: Drag & Drop Mechanics Optimization', assignee: 'Aditi Sharma', startWeek: 2, endWeek: 4, progress: 10, status: 'In Progress' },
        { id: '3', name: 'Phase 3: Custom Layout Presets & Templates', assignee: 'Rohit Verma', startWeek: 3, endWeek: 4, progress: 0, status: 'Planned' },
        { id: '4', name: 'Phase 4: Automated Render Verification Testing', assignee: 'All members', startWeek: 5, endWeek: 6, progress: 0, status: 'Planned' }
      ];
    default:
      return [
        { id: '1', name: 'Phase 1: Project Setup & Env Config', assignee: 'Team', startWeek: 1, endWeek: 2, progress: 100, status: 'Completed' },
        { id: '2', name: 'Phase 2: Feature Mockups & Core Layouts', assignee: 'Team', startWeek: 2, endWeek: 4, progress: 50, status: 'In Progress' },
        { id: '3', name: 'Phase 3: Integration Tests & QA checks', assignee: 'Team', startWeek: 4, endWeek: 6, progress: 0, status: 'Planned' }
      ];
  }
};

export const AuthorityDashboard: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    workLogs,
    workDescriptions,
    createWorkDescription,
    addProjectMember,
    removeProjectMember,
    createProject,
    isLoading
  } = useApp();

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState<'timeline' | 'backlog' | 'submissions' | 'projects' | 'team'>('timeline');

  // Create description/Backlog states
  const [descriptionContent, setDescriptionContent] = useState('');
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | ''>('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Add member states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Selected submission slideout drawer
  const [selectedLogForReview, setSelectedLogForReview] = useState<WorkLog | null>(null);

  // Create Project states
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjAuthority, setNewProjAuthority] = useState('');
  const [uploadedMembers, setUploadedMembers] = useState<Omit<TeamMember, 'id'>[]>([]);
  const [memberInputText, setMemberInputText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Project statistics & data
  const projectLogs = workLogs.filter(l => l.projectId === selectedProjectId);
  const projectDescriptions = workDescriptions.filter(d => d.projectId === selectedProjectId);
  const latestDescription = projectDescriptions[0];

  const totalLogs = projectLogs.length;
  const scoredLogs = projectLogs.filter(l => l.review && l.review.score !== null);
  const averageScore = scoredLogs.length
    ? Math.round(scoredLogs.reduce((acc, l) => acc + (l.review?.score || 0), 0) / scoredLogs.length)
    : 0;
  const pendingReviews = totalLogs - scoredLogs.length;
  const completionRate = totalLogs
    ? Math.round((scoredLogs.filter(l => (l.review?.score || 0) >= 80).length / totalLogs) * 100)
    : 0;

  // Auto-save requirements draft simulation
  useEffect(() => {
    if (!descriptionContent) return;
    setIsAutoSaving(true);
    const delay = setTimeout(() => {
      setIsAutoSaving(false);
    }, 1000);
    return () => clearTimeout(delay);
  }, [descriptionContent]);

  const handleApplyTemplate = (idx: number) => {
    setDescriptionContent(TEMPLATES[idx].text);
    setSelectedTemplateIdx(idx);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionContent.trim()) return;

    setPublishLoading(true);
    try {
      // Sprints published to the project team as a whole (pass any default member ID, backend ignores assigneeId anyway)
      const defaultAssigneeId = activeProject.members.length > 0 ? activeProject.members[0].id : 'team';
      await createWorkDescription(selectedProjectId, defaultAssigneeId, descriptionContent);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setDescriptionContent('');
        setSelectedTemplateIdx('');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberRole.trim() || !newMemberEmail.trim()) return;

    const initial = newMemberName.trim().charAt(0).toUpperCase();
    const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80`; // Placeholder avatar

    addProjectMember(selectedProjectId, {
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
      email: newMemberEmail.trim(),
      avatar
    });

    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberEmail('');
  };

  const parseTeamMembersFile = (text: string, filename: string) => {
    try {
      if (filename.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const valid = parsed.map(m => ({
            name: m.name || 'Unknown Member',
            role: m.role || 'Software Engineer',
            email: m.email || '',
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80`
          }));
          setUploadedMembers(prev => [...prev, ...valid]);
        }
      } else {
        // Assume CSV
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        // Skip header if it exists
        const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;
        const valid: { name: string; role: string; email: string; avatar: string }[] = [];
        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            valid.push({
              name: parts[0],
              role: parts[1],
              email: parts[2] || `${parts[0].toLowerCase().replace(/\s+/g, '')}@example.com`,
              avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80`
            });
          }
        }
        setUploadedMembers(prev => [...prev, ...valid]);
      }
    } catch (e) {
      console.error('Failed to parse file:', e);
    }
  };

  const handleBulkImportText = () => {
    if (!memberInputText.trim()) return;
    const lines = memberInputText.split('\n').map(l => l.trim()).filter(Boolean);
    const valid: { name: string; role: string; email: string; avatar: string }[] = [];
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        valid.push({
          name: parts[0],
          role: parts[1],
          email: parts[2] || `${parts[0].toLowerCase().replace(/\s+/g, '')}@example.com`,
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80`
        });
      }
    }
    setUploadedMembers(prev => [...prev, ...valid]);
    setMemberInputText('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseTeamMembersFile(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseTeamMembersFile(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjCode.trim() || !newProjDesc.trim()) return;

    createProject({
      name: newProjName.trim(),
      code: newProjCode.trim(),
      description: newProjDesc.trim(),
      authorityName: newProjAuthority.trim() || 'Sarah Jenkins (VP of Product)',
      members: uploadedMembers
    });

    setNewProjName('');
    setNewProjCode('');
    setNewProjDesc('');
    setNewProjAuthority('');
    setUploadedMembers([]);
    setIsCreateProjectOpen(false);
  };

  // Recharts submissions chart data setup
  const activityData = [
    { name: 'Mon', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 1).length },
    { name: 'Tue', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 2).length },
    { name: 'Wed', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 3).length },
    { name: 'Thu', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 4).length },
    { name: 'Fri', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 5).length },
    { name: 'Sat', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 6).length },
    { name: 'Sun', submissions: projectLogs.filter(l => new Date(l.uploadedAt).getDay() === 0).length }
  ];

  return (
    <DashboardLayout>
      {/* Greetings Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-textPrimary-light dark:text-textPrimary-dark">
            Authority Panel
          </h1>
          <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mt-1">
            Jira Board overview for <span className="font-bold text-textPrimary-light dark:text-textPrimary-dark">{activeProject.name}</span> ({activeProject.code})
          </p>
        </div>
      </div>

      {/* Overview Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverGlow={false} className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Submitted Logs</span>
            <div className="text-2xl font-extrabold text-textPrimary-light dark:text-textPrimary-dark">{totalLogs}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-secondary dark:text-blue-400 flex items-center justify-center">
            <FileText size={20} />
          </div>
        </Card>

        <Card hoverGlow={false} className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Average Score</span>
            <div className={`text-2xl font-extrabold ${averageScore >= 80 ? 'text-success' : averageScore >= 50 ? 'text-warning' : 'text-danger'}`}>
              {averageScore}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-success dark:text-emerald-400 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
        </Card>

        <Card hoverGlow={false} className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Pending Review</span>
            <div className="text-2xl font-extrabold text-textPrimary-light dark:text-textPrimary-dark">{pendingReviews}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-warning dark:text-warning flex items-center justify-center">
            <Cpu size={20} />
          </div>
        </Card>

        <Card hoverGlow={false} className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Completion Rate</span>
            <div className="text-2xl font-extrabold text-textPrimary-light dark:text-textPrimary-dark">{completionRate}%</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-secondary dark:text-blue-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </Card>
      </div>

      {/* Tabs Navigation Header */}
      <div className="border-b border-borderLight dark:border-borderDark/40 flex overflow-x-auto gap-6 scrollbar-none pb-0.5">
        {[
          { id: 'timeline', label: 'Timeline Board', icon: <Calendar size={16} /> },
          { id: 'backlog', label: 'Backlog & Sprints', icon: <BookOpen size={16} /> },
          { id: 'submissions', label: 'Submissions feed', icon: <History size={16} /> },
          { id: 'projects', label: 'Projects Hub', icon: <LayoutGrid size={16} /> },
          { id: 'team', label: 'Team directory', icon: <Users size={16} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-all shrink-0 select-none
                ${isActive
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-textSecondary-light hover:text-textPrimary-light dark:text-textSecondary-dark dark:hover:text-textPrimary-dark'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents Panel */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Gantt Chart Timeline */}
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <Card hoverGlow={false} className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Sprint Roadmap Timeline</h2>
                    <p className="text-xs text-textSecondary-light mt-0.5">Interactive project phases and gantt progression</p>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-textSecondary-light">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Completed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600" /> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700" /> Planned</span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-borderLight dark:border-borderDark/40 rounded-2xl">
                  <div className="min-w-[800px] divide-y divide-borderLight dark:divide-borderDark/40 font-semibold">
                    
                    {/* Gantt Header Calendar */}
                    <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-900/50 py-3 text-xs uppercase tracking-wider text-textSecondary-light text-center font-bold items-center">
                      <div className="col-span-4 text-left pl-6">Sprint Tasks / Phase</div>
                      <div className="col-span-6 grid grid-cols-6 border-x border-transparent">
                        <div className="border-r border-slate-200/60 dark:border-slate-800/40">Wk 1</div>
                        <div className="border-r border-slate-200/60 dark:border-slate-800/40">Wk 2</div>
                        <div className="border-r border-slate-200/60 dark:border-slate-800/40">Wk 3</div>
                        <div className="border-r border-slate-200/60 dark:border-slate-800/40">Wk 4</div>
                        <div className="border-r border-slate-200/60 dark:border-slate-800/40">Wk 5</div>
                        <div>Wk 6</div>
                      </div>
                      <div className="col-span-2">Assignee</div>
                    </div>

                    {/* Gantt Rows */}
                    <div className="divide-y divide-borderLight dark:divide-borderDark/40">
                      {getGanttTasks(selectedProjectId).map((task) => {
                        let barColor = 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
                        if (task.status === 'Completed') {
                          barColor = 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]';
                        } else if (task.status === 'In Progress') {
                          barColor = 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]';
                        }

                        const startCol = task.startWeek;
                        const duration = task.endWeek - task.startWeek + 1;

                        return (
                          <div
                            key={task.id}
                            className="grid grid-cols-12 items-center text-center text-xs hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/20 transition-colors py-3"
                          >
                            
                            {/* Task name */}
                            <div className="col-span-4 text-left pl-6 font-bold text-textPrimary-light dark:text-textPrimary-dark">
                              {task.name}
                              <div className="text-[10px] text-textSecondary-light font-normal mt-0.5">Status: {task.status} ({task.progress}%)</div>
                            </div>

                            {/* Gantt Sub-grid with vertical lines and floating bar */}
                            <div className="col-span-6 grid grid-cols-6 relative h-10 border-x border-slate-100 dark:border-slate-800/40">
                              {/* Background grid column separators */}
                              {[1, 2, 3, 4, 5, 6].map((wk) => (
                                <div key={wk} className="border-r border-slate-100 dark:border-slate-800/20 last:border-r-0 h-full" />
                              ))}
                              
                              {/* Progress bar segment */}
                              <div
                                className={`absolute top-2 h-6 ${barColor} rounded-full flex items-center justify-end pr-2 text-[9px] text-white font-extrabold`}
                                style={{
                                  left: `${((startCol - 1) / 6) * 100}%`,
                                  width: `calc(${(duration / 6) * 100}% - 8px)`,
                                  marginLeft: '4px'
                                }}
                              >
                                {task.progress > 0 && <span>{task.progress}%</span>}
                              </div>
                            </div>

                            {/* Task Assignee chip */}
                            <div className="col-span-2 flex justify-center">
                              <span className="px-2.5 py-1 rounded-lg border border-borderLight dark:border-borderDark/60 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-textSecondary-light">
                                {task.assignee}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 2: Backlog & Sprints */}
          {activeTab === 'backlog' && (
            <motion.div
              key="backlog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Backlog Form */}
              <div className="lg:col-span-7 space-y-6">
                <Card hoverGlow={false} className="p-6 relative">
                  <div className="absolute top-6 right-6 flex items-center gap-1.5 text-xs text-textSecondary-light dark:text-textSecondary-dark font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaving ? 'bg-primary animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <span>{isAutoSaving ? 'Saving draft...' : 'Saved to draft'}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <Plus className="text-primary" size={20} />
                    <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Publish New Sprint Deliverables</h2>
                  </div>

                  <form onSubmit={handlePublish} className="space-y-6">
                    {/* Templates */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-textSecondary-light">Apply Template Preset</label>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATES.map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplyTemplate(idx)}
                            className={`text-xs font-medium px-3 py-1.5 rounded border transition-all ${
                              selectedTemplateIdx === idx
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white dark:bg-cardDark text-textSecondary-light dark:text-textSecondary-dark border-borderLight dark:border-borderDark hover:border-secondary hover:text-secondary'
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Team Scope (No target single assignee dropdown) */}
                    <div className="p-3 bg-bgLight dark:bg-bgDark border border-borderLight dark:border-borderDark rounded flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-primary">Target: Entire Project Team</div>
                        <div className="text-[10px] text-textSecondary-light mt-0.5">Tasks will be assigned project-wide and accessible by all members.</div>
                      </div>
                      <Users className="text-primary opacity-60" size={20} />
                    </div>

                    {/* Editor Tabs */}
                    <div className="flex bg-slate-100 dark:bg-[#1E293B] p-1 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => setEditorTab('edit')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                          editorTab === 'edit'
                            ? 'bg-white dark:bg-cardDark text-primary shadow-sm'
                            : 'text-textSecondary-light hover:text-textPrimary-light dark:text-textSecondary-dark'
                        }`}
                      >
                        <BookOpen size={13} /> Edit Requirements
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                          editorTab === 'preview'
                            ? 'bg-white dark:bg-cardDark text-primary shadow-sm'
                            : 'text-textSecondary-light hover:text-textPrimary-light dark:text-textSecondary-dark'
                        }`}
                      >
                        <Eye size={13} /> Markdown Preview
                      </button>
                    </div>

                    {/* Requirements input */}
                    <div>
                      {editorTab === 'edit' ? (
                        <div className="space-y-1">
                          <Textarea
                            label="Sprint Deliverables & Goals (Markdown supported)"
                            value={descriptionContent}
                            onChange={(e) => setDescriptionContent(e.target.value)}
                            placeholder="Detail objective, tasks to cover, database details, webhooks, and unit tests expectations..."
                            className="min-h-[220px]"
                            required
                          />
                          <div className="text-right text-[10px] text-textSecondary-light dark:text-textSecondary-dark font-medium">
                            Characters: <span className="font-semibold">{descriptionContent.length}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark rounded-xl min-h-[245px] overflow-y-auto text-sm leading-relaxed text-textPrimary-light dark:text-textPrimary-dark">
                          {descriptionContent.trim() ? (
                            descriptionContent.split('\n').map((line, idx) => {
                              if (line.startsWith('###')) return <h4 key={idx} className="text-sm font-extrabold mt-3 text-textPrimary-light dark:text-textPrimary-dark">{line.replace('###', '').trim()}</h4>;
                              if (line.startsWith('-') || line.startsWith('*')) return <li key={idx} className="ml-4 list-disc font-medium">{line.replace(/^[-*]\s*/, '')}</li>;
                              return <p key={idx} className="mb-2 font-medium">{line}</p>;
                            })
                          ) : (
                            <span className="text-textSecondary-light dark:text-textSecondary-dark italic">No requirements written yet. Use Edit Requirements to begin.</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        isLoading={publishLoading}
                        isSuccess={publishSuccess}
                        disabled={!descriptionContent.trim()}
                        className="shadow-sm w-full sm:w-auto"
                      >
                        Publish Sprint Backlog <Send size={15} />
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Current Active Requirements */}
              <div className="lg:col-span-5 space-y-6">
                <Card hoverGlow={false} className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="text-accent" size={20} />
                    <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Current Work Description</h2>
                  </div>

                  {latestDescription ? (
                    <div className="space-y-4">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark rounded-xl w-fit text-[10px] font-bold text-textSecondary-light">
                        Assigned to Team Members: {activeProject.members.map(m => m.name).join(', ')}
                      </div>
                      
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark rounded-xl text-sm leading-relaxed space-y-3">
                        {latestDescription.description.split('\n').map((line, idx) => {
                          if (line.startsWith('###')) return <h4 key={idx} className="text-sm font-extrabold mt-2 text-textPrimary-light dark:text-textPrimary-dark">{line.replace('###', '').trim()}</h4>;
                          if (line.startsWith('-') || line.startsWith('*')) return <li key={idx} className="ml-4 list-disc font-medium">{line.replace(/^[-*]\s*/, '')}</li>;
                          return <p key={idx} className="font-medium">{line}</p>;
                        })}
                      </div>

                      <div className="text-[10px] text-textSecondary-light font-semibold">
                        Published: {new Date(latestDescription.createdAt).toLocaleDateString()} at {new Date(latestDescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-sm text-textSecondary-light italic">
                      No active requirements published yet for this project team.
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Submissions Feed */}
          {activeTab === 'submissions' && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Submission TIMELINE List */}
              <div className="lg:col-span-7 space-y-6">
                <Card hoverGlow={false} className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Timeline Submissions</h2>
                      <p className="text-xs text-textSecondary-light mt-0.5">Developer logs and automatic AI scores</p>
                    </div>
                    <span className="text-[10px] font-bold text-textSecondary-light bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark py-0.5 px-3 rounded-full">{projectLogs.length} logs total</span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {projectLogs.map((log) => {
                      const score = log.review?.score;
                      let scoreBadgeClass = 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400';
                      if (score !== undefined) {
                        if (score >= 80) scoreBadgeClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
                        else if (score >= 50) scoreBadgeClass = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
                      }

                      return (
                        <div
                          key={log.id}
                          onClick={() => setSelectedLogForReview(log)}
                          className={`p-4 bg-white dark:bg-[#1E293B] border rounded-2xl hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer shadow-sm hover:shadow transition-all duration-200 ${
                            selectedLogForReview?.id === log.id ? 'border-primary/80 dark:border-primary/80 ring-2 ring-primary/10' : 'border-borderLight dark:border-borderDark'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                {activeProject.members.find(m => m.id === log.internId)?.name || 'Unknown Intern'}
                              </h4>
                              <p className="text-[11px] text-textSecondary-light dark:text-textSecondary-dark truncate mt-0.5">
                                {log.content}
                              </p>
                            </div>
                            {score !== undefined ? (
                              <div className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${scoreBadgeClass}`}>
                                {score}%
                              </div>
                            ) : (
                              <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 animate-pulse">
                                Pending AI
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center text-[9px] text-textSecondary-light dark:text-textSecondary-dark font-medium mt-3 border-t border-slate-50 dark:border-slate-800/40 pt-2">
                            <span>Submitted: {new Date(log.uploadedAt).toLocaleDateString()} at {new Date(log.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {log.fileName && <span className="underline truncate max-w-[120px]">{log.fileName}</span>}
                          </div>
                        </div>
                      );
                    })}

                    {projectLogs.length === 0 && (
                      <div className="text-center py-10 text-sm text-textSecondary-light dark:text-textSecondary-dark italic">
                        No team submissions uploaded yet for this project.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Submissions Stats charts */}
              <div className="lg:col-span-5 space-y-6">
                <Card hoverGlow={false} className="p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-textSecondary-light mb-4">Submissions Frequency</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(37,99,235,0.05)' }} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="submissions" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* TAB 4: Projects Hub Grid (Prominent project switching board) */}
          {activeTab === 'projects' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-borderLight dark:border-borderDark/20 pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Projects Directory</h2>
                  <p className="text-xs text-textSecondary-light mt-0.5">Switch project focus or define new team workspaces</p>
                </div>
                <Button onClick={() => setIsCreateProjectOpen(true)} className="h-9 px-4 text-xs font-bold gap-1">
                  <Plus size={14} /> Create New Project
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((proj) => {
                  const isActive = proj.id === selectedProjectId;
                  const logs = workLogs.filter(l => l.projectId === proj.id);
                  const scored = logs.filter(l => l.review && l.review.score !== null);
                  const avg = scored.length
                    ? Math.round(scored.reduce((acc, l) => acc + (l.review?.score || 0), 0) / scored.length)
                    : 0;

                  return (
                    <Card
                      key={proj.id}
                      hoverGlow={!isActive}
                      className={`p-6 border-t-4 flex flex-col justify-between min-h-[260px] relative overflow-hidden ${
                        isActive
                          ? 'border-t-primary border-primary/50 dark:border-primary/50 bg-primary/5'
                          : 'border-t-slate-300 dark:border-t-slate-700'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent">{proj.code}</span>
                            <h3 className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mt-0.5 truncate max-w-[200px]">{proj.name}</h3>
                          </div>
                          {isActive && (
                            <span className="text-[9px] font-extrabold text-white bg-primary px-2.5 py-0.5 rounded-full select-none">Active</span>
                          )}
                        </div>

                        <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark leading-relaxed line-clamp-2">
                          {proj.description}
                        </p>

                        {/* Team Mini avatars list */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-textSecondary-light font-bold">Team:</span>
                          <div className="flex -space-x-2">
                            {proj.members.slice(0, 3).map((m, i) => (
                              <img
                                key={m.id}
                                src={m.avatar}
                                alt={m.name}
                                title={`${m.name} (${m.role})`}
                                className="w-5 h-5 rounded-full object-cover border border-white dark:border-[#0F172A]"
                              />
                            ))}
                            {proj.members.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[8px] font-bold flex items-center justify-center border border-white dark:border-[#0F172A]">
                                +{proj.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stats KPIs inside project card */}
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/40 pt-3">
                          <div className="text-xs font-semibold">
                            <div className="text-textSecondary-light">Logs Submitted</div>
                            <div className="text-sm font-bold mt-0.5">{logs.length}</div>
                          </div>
                          <div className="text-xs font-semibold">
                            <div className="text-textSecondary-light">Avg AI Rating</div>
                            <div className={`text-sm font-bold mt-0.5 ${avg >= 80 ? 'text-success' : avg >= 50 ? 'text-warning' : 'text-danger'}`}>{avg}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-5 mt-auto">
                        <Button
                          onClick={() => setSelectedProjectId(proj.id)}
                          disabled={isActive}
                          variant={isActive ? 'secondary' : 'primary'}
                          className="w-full h-8 text-[11px] py-0"
                        >
                          {isActive ? 'Currently Active' : 'Switch Project Focus'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 5: Team Directory (Group Membership Management) */}
          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Member list */}
              <div className="lg:col-span-7 space-y-6">
                <Card hoverGlow={false} className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Team Members Directory</h2>
                      <p className="text-xs text-textSecondary-light mt-0.5">Manage permissions and membership inside the group</p>
                    </div>
                    <span className="text-[10px] font-bold text-textSecondary-light bg-slate-50 dark:bg-slate-900 border border-borderLight dark:border-borderDark py-0.5 px-3 rounded-full">{activeProject.members.length} members</span>
                  </div>

                  <div className="divide-y divide-borderLight dark:divide-borderDark/40">
                    {activeProject.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-borderLight dark:border-borderDark" />
                          <div>
                            <div className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark">{member.name}</div>
                            <div className="text-[10px] text-textSecondary-light dark:text-textSecondary-dark mt-0.5">{member.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] font-semibold text-textSecondary-light dark:text-textSecondary-dark hidden sm:block bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                            {member.email}
                          </div>
                          {/* Remove member button */}
                          <button
                            onClick={() => removeProjectMember(selectedProjectId, member.id)}
                            className="p-1.5 rounded-lg border border-danger/10 text-danger hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Remove team member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {activeProject.members.length === 0 && (
                      <div className="text-center py-10 text-sm text-textSecondary-light italic">
                        No team members registered. Add new members below.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Add Member Form */}
              <div className="lg:col-span-5 space-y-6">
                <Card hoverGlow={false} className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <UserPlus className="text-primary" size={20} />
                    <h2 className="text-base font-extrabold text-textPrimary-light dark:text-textPrimary-dark">Add New Team Member</h2>
                  </div>

                  <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                    <Input
                      label="Member Full Name"
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Sanjay Kumar"
                      required
                    />

                    <Input
                      label="Role Designation"
                      type="text"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      placeholder="e.g. Fullstack Developer"
                      required
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="e.g. sanjay@stripe.com"
                      required
                    />

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!newMemberName.trim() || !newMemberRole.trim() || !newMemberEmail.trim()}
                      >
                        Add Member To Group <Plus size={15} />
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Side drawer for full AI Review detailed auditing */}
      <AnimatePresence>
        {selectedLogForReview && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLogForReview(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-bgLight dark:bg-bgDark border-l border-borderLight dark:border-borderDark shadow-2xl p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-borderLight dark:border-borderDark/40 pb-4">
                <div>
                  <h3 className="text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">Submission Detailed Audit Report</h3>
                  <p className="text-[10px] text-textSecondary-light">Review results generated dynamically by AI review pipeline</p>
                </div>
                <button
                  onClick={() => setSelectedLogForReview(null)}
                  className="p-1 rounded-lg border border-borderLight dark:border-borderDark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close audit report modal"
                >
                  ✕
                </button>
              </div>

              {/* Log text content */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-textSecondary-light">Submitted Work Log Text</span>
                <div className="p-4 bg-white dark:bg-cardDark border border-borderLight dark:border-borderDark rounded-xl text-sm leading-relaxed max-h-40 overflow-y-auto text-textPrimary-light dark:text-textPrimary-dark font-medium">
                  {selectedLogForReview.content}
                </div>
              </div>

              {/* AI review card */}
              <AIReviewCard review={selectedLogForReview.review} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Side drawer for creating a new project */}
      <AnimatePresence>
        {isCreateProjectOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateProjectOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-bgLight dark:bg-bgDark border-l border-borderLight dark:border-borderDark shadow-2xl p-6 overflow-y-auto flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b border-borderLight dark:border-borderDark/40 pb-4">
                <div>
                  <h3 className="text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">Create New Project Workspace</h3>
                  <p className="text-[10px] text-textSecondary-light">Setup a new code directory, upload team members, and define assignees</p>
                </div>
                <button
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="p-1 rounded-lg border border-borderLight dark:border-borderDark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close create project drawer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-6">
                <Input
                  label="Project Name"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Stripe Billing Integration"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Project Code ID"
                    value={newProjCode}
                    onChange={(e) => setNewProjCode(e.target.value)}
                    placeholder="e.g. PRJ-8812"
                    required
                  />
                  <Input
                    label="Authority Manager Name"
                    value={newProjAuthority}
                    onChange={(e) => setNewProjAuthority(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>

                <Textarea
                  label="Project Scope / Objectives Description"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe the sprint criteria, webhook operational parameters, etc."
                  required
                  rows={3}
                />

                {/* Team upload section */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-textSecondary-light">
                    Assign Project Team Members (Interns & Authorities)
                  </label>

                  {/* Drag and Drop dropzone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      dragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-borderLight dark:border-borderDark/60 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="text-textSecondary-light opacity-60" size={24} />
                      <p className="text-xs text-textPrimary-light dark:text-textPrimary-dark font-medium">
                        Drag and drop team list file here (.csv or .json)
                      </p>
                      <p className="text-[10px] text-textSecondary-light">
                        Supported: CSV with columns name,role,email or JSON arrays
                      </p>
                      <label className="cursor-pointer text-xs font-bold text-primary dark:text-blue-400 hover:underline mt-1">
                        Browse files
                        <input
                          type="file"
                          accept=".csv,.json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Copy-paste bulk import fallback */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-textSecondary-light uppercase">
                      Or Bulk Copy-Paste Names (Name, Role, Email - one per line)
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={memberInputText}
                        onChange={(e) => setMemberInputText(e.target.value)}
                        placeholder="e.g.&#10;Sanjay Kumar, Frontend Intern, sanjay@stripe.com&#10;Rohit Verma, Backend Intern, rohit@stripe.com"
                        rows={2}
                        className="w-full text-xs p-2 rounded-xl border border-borderLight dark:border-borderDark/40 bg-white dark:bg-cardDark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:border-primary"
                      />
                      <Button
                        type="button"
                        onClick={handleBulkImportText}
                        className="h-auto text-xs px-3 font-semibold shrink-0"
                      >
                        Add List
                      </Button>
                    </div>
                  </div>

                  {/* Uploaded members preview list */}
                  {uploadedMembers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-textSecondary-light uppercase">
                          Draft Team Members ({uploadedMembers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setUploadedMembers([])}
                          className="text-[10px] font-semibold text-danger hover:underline"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto space-y-2 border border-borderLight dark:border-borderDark/40 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                        {uploadedMembers.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-cardDark rounded-lg border border-borderLight dark:border-borderDark/40">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark truncate max-w-[140px]">{m.name}</div>
                                <div className="text-[9px] text-textSecondary-light truncate max-w-[180px]">{m.role} ({m.email})</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={m.role.toLowerCase().includes('intern') ? 'intern' : m.role.toLowerCase().includes('authority') || m.role.toLowerCase().includes('manager') ? 'authority' : 'member'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let newRole = m.role;
                                  if (val === 'intern') newRole = 'Software Intern';
                                  else if (val === 'authority') newRole = 'Project Authority';
                                  else newRole = 'Software Engineer';
                                  setUploadedMembers(prev => prev.map((item, i) => i === idx ? { ...item, role: newRole } : item));
                                }}
                                className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-textPrimary-light dark:text-textPrimary-dark border-none rounded p-1"
                              >
                                <option value="member">Member</option>
                                <option value="intern">Intern</option>
                                <option value="authority">Authority</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => setUploadedMembers(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-danger hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-borderLight dark:border-borderDark/40 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsCreateProjectOpen(false)}
                    className="h-10 text-xs px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 text-xs px-5"
                    disabled={!newProjName.trim() || !newProjCode.trim() || !newProjDesc.trim()}
                  >
                    Create Project Workspace <Plus size={14} />
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
};
