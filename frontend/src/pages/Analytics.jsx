import React from 'react';
import { TrendingUp, Users, CheckCircle2, Award, Clock, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { BrandLoader } from '../components/common/BrandLoader';
import { EmptyState } from '../components/ui/EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const Analytics = () => {
  const { analytics, loading, interviews, candidates } = useApp();

  if (loading) {
    return (
      <BrandLoader 
        message="Computing Recruitment Analytics..." 
        subtext="Synthesizing completion rates, department metrics, and score distributions"
        fullScreen={true} 
      />
    );
  }

  const kpis = analytics?.kpis || {
    averageScore: 0,
    conversionRate: 0,
    completions: 0
  };
  const departmentStats = analytics?.departmentStats || [
    { name: 'Engineering', count: 0, avg: 0 },
    { name: 'Product', count: 0, avg: 0 },
    { name: 'Design', count: 0, avg: 0 }
  ];
  const scoreDistribution = analytics?.scoreDistribution || [];
  const weeklyCompletions = analytics?.weeklyCompletions || [];

  const cards = [
    { 
      name: 'Calibrated Average Score', 
      value: `${kpis.averageScore || 0}%`, 
      icon: Award, 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      description: 'Cohort average across completed assessments'
    },
    { 
      name: 'Assessment Completion Rate', 
      value: `${kpis.conversionRate || 100}%`, 
      icon: TrendingUp, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Candidates completing assigned assessments'
    },
    { 
      name: 'Total Evaluated Applicants', 
      value: kpis.completions || 0, 
      icon: CheckCircle2, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'Complete evaluation dossiers filed'
    },
  ];

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Hiring Intelligence & Analytics</h1>
            <Badge variant="secondary" size="xs">Overview</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cohort trends, candidate score distributions, and department assessment performance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex items-center justify-between transition-all duration-200 group">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{card.name}</span>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">{card.value}</h3>
              <p className="text-[11px] text-slate-500 mt-1">{card.description}</p>
            </div>
            <div className={`p-3.5 rounded-xl border ${card.color} shrink-0 shadow-xs`}>
              <card.icon className="w-5 h-5 stroke-[1.75]" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Department Performance Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Performance</h3>
              <span className="text-xs text-slate-500">Average technical score by functional team</span>
            </div>
            <Badge variant="secondary" size="xs">Score %</Badge>
          </div>
          <div className="h-64">
            {departmentStats && departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#FFF', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                  <Bar dataKey="avg" name="Average Score %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department metrics recorded.
              </div>
            )}
          </div>
        </div>

        {/* Score Ranges Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Evaluation Score Distribution</h3>
              <span className="text-xs text-slate-500">Candidate assessment scores breakdown</span>
            </div>
            <Badge variant="secondary" size="xs">Candidates</Badge>
          </div>
          <div className="h-64">
            {scoreDistribution && scoreDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#FFF', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                  <Area type="monotone" dataKey="count" name="Candidates" stroke="#2563EB" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ r: 4, fill: '#2563EB' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No score distribution recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
