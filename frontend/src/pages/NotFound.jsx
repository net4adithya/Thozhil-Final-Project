import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
      <div className="p-4 bg-primary/5 rounded-full text-primary mb-6 border border-primary/10">
        <HelpCircle className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-brandHeading tracking-tight mb-2">404</h1>
      <h3 className="text-base font-bold text-brandHeading mb-2">Page Not Found</h3>
      <p className="text-sm text-brandBody max-w-sm mb-8 leading-relaxed">
        The requested path does not exist or has been relocated to another workspace view.
      </p>
      
      <div className="flex items-center space-x-3">
        <Button onClick={() => navigate(-1)} variant="secondary" icon={ArrowLeft}>
          Go Back
        </Button>
        <Button onClick={() => navigate('/')} variant="primary" icon={Home}>
          Return Home
        </Button>
      </div>
    </div>
  );
};
