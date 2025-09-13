import React from 'react';

interface RiskBadgeProps {
  level?: 'low' | 'medium' | 'high';
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level = 'low', score = 0 }) => {
  const getColor = () => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`}>
      {level.toUpperCase()} RISK ({score})
    </span>
  );
}; 