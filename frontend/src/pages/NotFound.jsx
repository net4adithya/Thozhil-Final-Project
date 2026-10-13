import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none font-sans text-slate-900 min-h-[70vh]">
      <div className="bg-white rounded-xl p-10 sm:p-12 shadow-xs border border-slate-200 max-w-md w-full flex flex-col items-center">
        <div className="w-14 h-14 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center mb-5 border border-slate-200 shadow-xs">
          <HelpCircle className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">404</h1>
        <h3 className="text-base font-bold text-slate-800 mb-2">Page Not Found</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xs mb-8 leading-relaxed">
          The requested path does not exist or has been relocated to another workspace view.
        </p>
        
        <div className="flex items-center space-x-3 w-full justify-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="secondary" 
            icon={ArrowLeft} 
          >
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            variant="primary"
            icon={Home}
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};
