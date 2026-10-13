import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Breadcrumb = ({
  items = [], // { label: string, path?: string }[]
  className = '',
}) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-brandBody select-none ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        
        return (
          <div key={idx} className="flex items-center">
            {idx > 0 && <ChevronRight className="w-4 h-4 mx-1.5 text-gray-400 shrink-0" />}
            
            {isLast || !item.path ? (
              <span className={`font-medium ${isLast ? 'text-brandHeading' : ''}`}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-brandHeading hover:underline transition-colors duration-150"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
