import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, Calendar, BookOpen, Trash2, ArrowUpRight, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

export const InterviewList = () => {
  const { interviews, deleteInterview, loading } = useApp();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Draft'
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredInterviews = interviews.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status) => {
    if (status === 'Active') return <Badge variant="success">Active</Badge>;
    return <Badge variant="secondary">Draft</Badge>;
  };

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Hiring Openings</h1>
          <p className="text-sm text-brandBody">Create and manage active candidate interview processes.</p>
        </div>
        <Button
          onClick={() => navigate('/recruiter/interviews/create')}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          Create Interview
        </Button>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="flex items-center space-x-2.5 border-b border-brandBorder select-none">
        {['ALL', 'Active', 'Draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-all duration-200 ${
              (tab === filter)
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-brandBody hover:text-brandHeading'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {filteredInterviews.length === 0 ? (
        <div className="py-12 flex-grow flex items-center justify-center">
          <EmptyState
            icon={Video}
            title="No assessments found"
            description="You don't have any interviews matching this category filter. Launch your first process now."
            actionLabel="Create Interview"
            onAction={() => navigate('/recruiter/interviews/create')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow items-start">
          {filteredInterviews.map((int) => (
            <Card key={int.id} className="hover:shadow-md hover:border-gray-300">
              <CardBody className="p-5 text-left space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">
                      {int.department}
                    </span>
                    <h3 className="text-base font-bold text-brandHeading tracking-tight">
                      {int.title}
                    </h3>
                  </div>
                  {getStatusBadge(int.status)}
                </div>

                <p className="text-xs text-brandBody leading-relaxed line-clamp-2">
                  Launch code: <code className="bg-gray-100 text-slate-800 px-1 rounded">{int.id}</code>. 
                  Contains question categories evaluated dynamically by AI agent upon completion.
                </p>

                {/* Sub metrics */}
                <div className="grid grid-cols-2 gap-4 border-t border-b border-brandBorder py-3 text-xs select-none">
                  <div className="space-y-0.5">
                    <span className="text-brandBody">Questions</span>
                    <div className="flex items-center space-x-1 font-semibold text-brandHeading">
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{int.questions?.length || 0} items</span>
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-brandBody">Completions</span>
                    <div className="flex items-center space-x-1 font-semibold text-brandHeading">
                      <Calendar className="w-3.5 h-3.5 text-brandSuccess shrink-0" />
                      <span>{int.completedCount} / {int.candidateCount}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
              
              <CardFooter className="px-5 py-3.5 bg-gray-50/50 flex items-center justify-between">
                <button
                  onClick={() => deleteInterview(int.id)}
                  className="text-brandBody hover:text-brandDanger p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Loop"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <Button
                  onClick={() => navigate(`/recruiter/interviews/${int.id}`)}
                  variant="secondary"
                  size="sm"
                  icon={ArrowUpRight}
                  iconPosition="right"
                >
                  Open Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
