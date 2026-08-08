import React from 'react';
import { TrendingUp, Users, CheckCircle2, Award, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
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
  Legend
} from 'recharts';

export const Analytics = () => {
  const { analytics, loading } = useApp();

  if (loading || !analytics) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { kpis, departmentStats, scoreDistribution } = analytics;

  const cards = [
    { name: 'Average Score Match', value: `${kpis.averageScore}%`, icon: Award, color: 'text-primary bg-blue-50 border-blue-100' },
    { name: 'Completion Conversion', value: `${kpis.conversionRate}%`, icon: TrendingUp, color: 'text-brandSuccess bg-green-50 border-green-100' },
    { name: 'Total Evaluated', value: kpis.completions, icon: CheckCircle2, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  ];

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="text-left select-none">
        <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Hiring Intelligence</h1>
        <p className="text-sm text-brandBody">Deep dive into candidate evaluations, matching stats, and department performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        {cards.map((card, idx) => (
          <Card key={idx}>
            <CardBody className="flex items-center justify-between p-5 text-left">
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Department performance bar chart */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Department Performance</h3>
            <Badge variant="primary">Average Scores</Badge>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF' }}
                />
                <Bar dataKey="avg" name="Average Score %" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Score ranges counts line chart */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-brandHeading">Evaluation Score Distribution</h3>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="range" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', border: 'none', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="count" name="Evaluated Count" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
