import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Clock, FileText, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { BrandLoader } from '../components/common/BrandLoader';

export const InterviewTemplates = () => {
  const { templates, loading, createInterview } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-24">
        <BrandLoader message="Loading assessment blueprints..." subMessage="Fetching role-calibrated technical evaluation templates" />
      </div>
    );
  }

  const handleQuickLaunch = async (tpl) => {
    try {
      const interviewData = {
        title: `${tpl.name} Assessment`,
        department: tpl.department || 'Engineering',
        type: 'async',
        interviewType: 'async',
        status: 'Active',
        duration: tpl.duration || 30,
        templateId: tpl.id,
        questions: tpl.questions || []
      };
      
      const newInt = await createInterview(interviewData);
      navigate(`/recruiter/interviews/${newInt.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const tplList = templates || [];

  return (
    <div className="space-y-6 flex-1 flex flex-col text-left font-sans text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 select-none">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Assessment Templates</h1>
          <p className="text-xs text-slate-500 mt-0.5">Ready-to-use evaluation blueprints mapped to standard technical hiring roles.</p>
        </div>
      </div>

      {/* Grid of Templates */}
      {tplList.length === 0 ? (
        <EmptyState
          title="No templates available"
          description="Pre-configured assessment templates will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {tplList.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 shadow-xs transition-colors flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                    {tpl.department || 'Engineering'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">
                    {tpl.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {tpl.description || 'Standard technical evaluation blueprint.'}
                </p>

                {/* Skills tags list */}
                {tpl.skills && tpl.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tpl.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tpl.questionCount || tpl.questions?.length || 0} Questions</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{tpl.duration || 30} mins</span>
                  </span>
                </div>

                <Button
                  onClick={() => handleQuickLaunch(tpl)}
                  variant="primary"
                  size="xs"
                  className="w-full"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Use Blueprint
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewTemplates;
