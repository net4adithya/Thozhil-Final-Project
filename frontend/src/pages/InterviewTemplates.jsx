import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plus, Clock, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export const InterviewTemplates = () => {
  const { templates, loading, createInterview } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleQuickLaunch = async (tpl) => {
    try {
      const interviewData = {
        title: `${tpl.name} Hiring Loop`,
        department: tpl.department,
        status: 'Active',
        duration: tpl.duration,
        templateId: tpl.id,
        questions: tpl.questions
      };
      
      const newInt = await createInterview(interviewData);
      navigate(`/recruiter/interviews/${newInt.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brandHeading">Assessment Templates</h1>
          <p className="text-sm text-brandBody">Deploy pre-configured question sets mapped to core company roles.</p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow items-start">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="hover:shadow-md hover:border-gray-300">
            <CardBody className="p-5 text-left flex flex-col h-full space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brandBody">
                  {tpl.department}
                </span>
                <h3 className="text-base font-bold text-brandHeading tracking-tight">
                  {tpl.name}
                </h3>
              </div>

              <p className="text-xs text-brandBody leading-relaxed flex-grow">
                {tpl.description}
              </p>

              {/* Skills tags list */}
              <div className="flex flex-wrap gap-1.5 select-none py-1">
                {tpl.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[9px] font-semibold bg-gray-100 border border-brandBorder px-2 py-0.5 rounded text-brandBody"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Basic configs details */}
              <div className="grid grid-cols-2 gap-4 border-t border-brandBorder pt-3 text-xs select-none">
                <div className="space-y-0.5">
                  <span className="text-brandBody">Total Questions</span>
                  <div className="flex items-center space-x-1 font-semibold text-brandHeading">
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{tpl.questionCount} prompts</span>
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-brandBody">Timer Limit</span>
                  <div className="flex items-center space-x-1 font-semibold text-brandHeading">
                    <Clock className="w-3.5 h-3.5 text-brandWarning shrink-0" />
                    <span>{tpl.duration} mins</span>
                  </div>
                </div>
              </div>
            </CardBody>

            <CardFooter className="px-5 py-3.5 bg-gray-50/50 flex items-center gap-2 select-none">
              <Button
                onClick={() => handleQuickLaunch(tpl)}
                variant="secondary"
                size="sm"
                className="w-full"
                icon={CheckCircle2}
              >
                Quick Launch Loop
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
