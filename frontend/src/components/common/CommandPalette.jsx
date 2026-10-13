import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  PlusCircle, 
  Users, 
  Video, 
  TrendingUp, 
  FolderLock, 
  Settings, 
  ExternalLink, 
  FileText, 
  UserPlus, 
  Sparkles,
  Command,
  X,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommandPalette = ({ isOpen, onClose }) => {
  const { candidates, interviews } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Actions list
  const staticActions = [
    { id: 'act-new-assessment', title: 'Create New Assessment', category: 'Actions', icon: PlusCircle, path: '/recruiter/interviews/new' },
    { id: 'act-invite-cand', title: 'Invite Candidate', category: 'Actions', icon: UserPlus, path: '/recruiter/candidates?invite=true' },
    { id: 'act-all-candidates', title: 'View Candidate Roster', category: 'Navigation', icon: Users, path: '/recruiter/candidates' },
    { id: 'act-all-interviews', title: 'View All Assessments & Jobs', category: 'Navigation', icon: Video, path: '/recruiter/interviews' },
    { id: 'act-analytics', title: 'View Hiring Analytics', category: 'Navigation', icon: TrendingUp, path: '/recruiter/analytics' },
    { id: 'act-questions', title: 'Open Question Bank', category: 'Navigation', icon: FolderLock, path: '/recruiter/questions' },
    { id: 'act-candidate-portal', title: 'Switch to Candidate Portal', category: 'Portal', icon: ExternalLink, path: '/candidate' },
    { id: 'act-settings', title: 'System Settings', category: 'Navigation', icon: Settings, path: '/recruiter/settings' },
  ];

  // Candidates matches
  const candidateItems = (candidates || []).map(c => ({
    id: `cand-${c.id}`,
    title: `${c.name} (${c.role || 'Candidate'})`,
    subtitle: c.email || (c.overall_score ? `Score: ${c.overall_score}%` : 'Assessment Assigned'),
    category: 'Candidates',
    icon: FileText,
    path: (c.status === 'Completed' || c.status === 'Evaluated' || c.overall_score) 
      ? `/recruiter/candidates/${c.id}/report` 
      : `/recruiter/candidates`
  }));

  // Interviews matches
  const interviewItems = (interviews || []).map(i => ({
    id: `int-${i.id}`,
    title: `${i.title} (${i.department || 'Engineering'})`,
    subtitle: `${i.type === 'live' ? 'Live AI' : 'Async'} • ${i.questions?.length || 0} Questions`,
    category: 'Assessments',
    icon: Video,
    path: `/recruiter/interviews/${i.id}`
  }));

  const allItems = [...staticActions, ...candidateItems, ...interviewItems];

  const filteredItems = query.trim() === ''
    ? staticActions
    : allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    navigate(item.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 select-none animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, candidate name, or search assessments..."
            className="w-full py-4 text-sm text-slate-900 bg-transparent outline-none placeholder-slate-400 font-medium"
          />
          <div className="flex items-center space-x-1.5 shrink-0 pl-2">
            <span className="text-[10px] font-semibold text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded shadow-xs">ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50 text-left">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No results found for "<span className="font-semibold text-slate-600">{query}</span>"
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span><strong className="text-slate-600">↑↓</strong> Navigate</span>
            <span><strong className="text-slate-600">↵</strong> Select</span>
            <span><strong className="text-slate-600">ESC</strong> Close</span>
          </div>
          <span className="font-medium text-slate-500">InterviewX AI Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
