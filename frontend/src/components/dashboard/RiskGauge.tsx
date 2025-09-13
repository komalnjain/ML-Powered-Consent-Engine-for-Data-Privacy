import React from 'react';

interface RiskGaugeProps {
  score: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const getColor = () => {
    if (score >= 7) return 'text-red-500';
    if (score >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Defensive: ensure score is a number
  const safeScore = typeof score === 'number' && !isNaN(score) ? score : 0;

  return (
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-3xl font-bold ${getColor()}`}>
          {safeScore.toFixed(1)}
        </div>
      </div>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r="40"
          cx="50"
          cy="50"
        />
        <circle
          className={getColor()}
          strokeWidth="8"
          strokeDasharray={`${safeScore * 25.13} 251.3`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="40"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
}; 