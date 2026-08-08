import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Video,
  CheckCircle2,
  TrendingUp,
  Plus,
  Send,
  FileSpreadsheet,
  HelpCircle,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Spinner } from '../components/ui/Spinner';
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  YAxis
} from 'recharts';

export const RecruiterDashboard = () => {
  const { analytics, candidates, interviews, loading } = useApp();
  const navigate = useNavigate();

  if (loading || !analytics) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { kpis, weeklyCompletions, scoreDistribution } = analytics;

  // Filter recent 3 candidates
  const recentCandidates = [...candidates]
    .filter(c => c.status !== 'Invited')
    .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))
    .slice(0, 3);

  // Filter active interviews
  const activeInterviews = interviews.filter(i => i.status === 'Active').slice(0, 3);

  const kpiCards = [
    { name: 'Active Openings', value: kpis.activeInterviews, icon: Video, color: 'text-primary bg-blue-50 border-blue-100' },
    { name: 'Invited Candidates', value: kpis.totalInvited, icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-100' },
    { name: 'Completed Reviews', value: kpis.completions, icon: CheckCircle2, color: 'text-brandSuccess bg-green-50 border-green-100' },
    { name: 'Avg Score Match', value: `${kpis.averageScore}%`, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 border-amber-100' },
  ];

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header and Quick action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Recruitment Overview</h1>
          <p className="text-sm text-brandBody">Review applicant trends, scores, and active hiring loops.</p>
        </div>
        <div className="flex items-center space-x-3.5">
          <Button
            onClick={() => navigate('/recruiter/candidates?invite=true')}
            variant="secondary"
            size="sm"
            icon={UserPlus}
          >
            Invite Candidate
          </Button>
          <Button
            onClick={() => navigate('/recruiter/interviews/create')}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            Create Interview
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        {kpiCards.map((card, idx) => (
          <Card key={idx} className="border-brandBorder">
            <CardBody className="flex items-center justify-between p-5">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-brandBody uppercase tracking-wider">{card.name}</span>
                <h3 className="text-2xl font-extrabold text-brandHeading tracking-tight">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-xl border ${card.color} shrink-0`}>
                <card.icon className="w-6 h-6" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
        {/* Analytics Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Evaluation Volume</h3>
            <Badge variant="success">This Week</Badge>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCompletions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF' }}
                  labelClassName="text-gray-400 text-xs"
                />
                <Area type="monotone" dataKey="count" name="Evaluated" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletions)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Score Distribution Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Score Distribution</h3>
          </CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="range" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF' }}
                />
                <Bar dataKey="count" name="Candidates" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evaluated Candidates */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-brandHeading">Recent Submissions</h3>
            <Button onClick={() => navigate('/recruiter/candidates')} variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">
              View All
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-brandBorder">
              {recentCandidates.length === 0 ? (
                <div className="py-8 text-center text-sm text-brandBody">No recently graded candidates.</div>
              ) : (
                recentCandidates.map((cand) => (
                  <div key={cand.id} className="p-4.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3.5">
                      <Avatar name={cand.name} size="sm" />
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-brandHeading">{cand.name}</span>
                        <span className="text-xs text-brandBody truncate max-w-xs">{cand.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${
                          cand.overallScore >= 80 ? 'text-brandSuccess' : cand.overallScore >= 70 ? 'text-primary' : 'text-brandWarning'
                        }`}>
                          {cand.overallScore}%
                        </span>
                        <span className="text-[10px] text-brandBody">Rating</span>
                      </div>
                      <Button onClick={() => navigate(`/recruiter/candidates/${cand.id}/report`)} variant="secondary" size="sm">
                        Report
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        {/* Active Job Openings / Interviews list */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-brandHeading">Active Job Openings</h3>
            <Button onClick={() => navigate('/recruiter/interviews')} variant="ghost" size="sm" icon={ChevronRight} iconPosition="right">
              All Openings
            </Button>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-brandBorder">
              {activeInterviews.map((int) => (
                <div key={int.id} className="p-4.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="text-left space-y-1">
                    <span className="text-sm font-bold text-brandHeading block">{int.title}</span>
                    <div className="flex items-center space-x-2 text-xs text-brandBody">
                      <span>{int.department}</span>
                      <span>•</span>
                      <span>{int.questions.length} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-brandHeading">{int.completedCount} / {int.candidateCount}</span>
                      <span className="text-[10px] text-brandBody">Completions</span>
                    </div>
                    <Button onClick={() => navigate(`/recruiter/interviews/${int.id}`)} variant="secondary" size="sm">
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
