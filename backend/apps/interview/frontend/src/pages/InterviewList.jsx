import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Plus, 
  Search, 
  BookOpen, 
  Trash2, 
  Clock, 
  Users,
  Briefcase,
  Pencil
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { BrandLoader } from '../components/common/BrandLoader';
import { EmptyState } from '../components/ui/EmptyState';
import { EditInterviewModal } from '../components/interview/EditInterviewModal';

export const InterviewList = () => {
  const { interviews, candidates, deleteInterview, refreshData, showToast, loading } = useApp();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Draft'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingInterview, setEditingInterview] = useState(null);
  const navigate = useNavigate();

  if (loading) {
    return (
      <BrandLoader 
        message="Loading Assessment Tracks..." 
        subtext="Synchronizing technical evaluation catalog"
        fullScreen={true} 
      />
    );
  }

  const filteredInterviews = (interviews || []).filter((item) => {
    const matchesFilter = filter === 'ALL' || item.status === filter;
    const matchesSearch = !searchQuery.trim() || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.jobRole?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Assessments & Positions</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure live and recorded evaluation pipelines for technical hiring roles.</p>
        </div>
        <Button
          onClick={() => navigate('/recruiter/interviews/new')}
          variant="primary"
          size="sm"
          icon={Plus}
        >
          Create Assessment
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80 self-start">
          {[
            { id: 'ALL', label: 'All Positions' },
            { id: 'Active', label: 'Active' },
            { id: 'Draft', label: 'Drafts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles or departments..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Main Grid */}
      {filteredInterviews.length === 0 ? (
        <EmptyState
          title="No assessments found"
          description={
            searchQuery 
              ? "No job openings match your search query. Try clearing your search."
              : "You have not created any assessments yet. Click below to configure your first assessment."
          }
          actionLabel="Create Assessment"
          onAction={() => navigate('/recruiter/interviews/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredInterviews.map((int) => {
            const isLive = int.type === 'live' || int.interviewType === 'live';
            const questionCount = int.questions?.length || 0;
            const duration = int.duration || int.durationMinutes || 30;
            const assignedCount = (candidates || []).filter(c => 
              c.interviewId === int.id || 
              c.interview_id === int.id || 
              c.id === int.candidate_id || 
              c.id === int.candidateId || 
              c.id === int.candidate?.id
            ).length;

            return (
              <div 
                key={int.id} 
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all duration-200 flex flex-col justify-between group overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 text-left min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate">
                        {int.department || 'Engineering'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug truncate group-hover:text-blue-600 transition-colors">
                        {int.title || int.jobRole}
                      </h3>
                    </div>
                    <Badge variant={int.status === 'Active' || !int.status ? 'success' : 'secondary'} size="xs" dot={int.status === 'Active' || !int.status}>
                      {int.status || 'Active'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {int.description || `Technical evaluation pipeline for ${int.jobRole || int.title}.`}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                    <Badge variant={isLive ? 'live' : 'secondary'} size="xs">
                      {isLive ? 'Live Interview' : 'Recorded Assessment'}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>{questionCount} Questions</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{duration}m</span>
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{assignedCount} {assignedCount === 1 ? 'candidate' : 'candidates'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingInterview(int)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                      title="Edit assessment"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteInterview(int.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      onClick={() => navigate(`/recruiter/interviews/${int.id}`)}
                      size="xs"
                      variant="secondary"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Interview Modal */}
      {editingInterview && (
        <EditInterviewModal
          isOpen={!!editingInterview}
          interview={editingInterview}
          onClose={() => setEditingInterview(null)}
          onUpdated={() => {
            if (typeof refreshData === 'function') refreshData();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default InterviewList;
