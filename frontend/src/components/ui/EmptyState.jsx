import React from 'react';
import { Inbox, ArrowRight } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active records in this view yet. Start by creating a new assessment.',
  actionLabel = null,
  onAction = null,
  secondaryActionLabel = null,
  onSecondaryAction = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 ${className}`}>
      <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 mb-4 shadow-xs">
        <Icon className="w-7 h-7 stroke-[1.75]" />
      </div>
      <h3 className="text-sm md:text-base font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs md:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>
      
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} size="sm" variant="outline">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
