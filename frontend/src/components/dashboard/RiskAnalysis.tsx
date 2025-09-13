// src/components/dashboard/RiskAnalysis.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { RadarChart } from './charts/RadarChart.tsx';
import { RiskGauge } from './RiskGauge.tsx';
import { RiskBadge } from './RiskBadge';

interface RiskCategory {
  [category: string]: number;
}

interface Permission {
  description: string;
  enabled: boolean;
  name: string;
  remediation: string;
  risk: number;
}

interface RiskAnalysisProps {
  risks: {
    risk_score: number;
    categories: RiskCategory;
    permissions: Permission[];
    [key: string]: any;
  };
}

export function RiskAnalysis({ risks }: RiskAnalysisProps) {
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (risks.risk_score >= 7) riskLevel = 'high';
  else if (risks.risk_score >= 4) riskLevel = 'medium';
  else riskLevel = 'low';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-6 mb-6 border border-opacity-10 border-white"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiAlertTriangle className="text-yellow-500" />
          Risk Analysis
        </h2>
        <RiskBadge level={riskLevel} score={risks.risk_score} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart - Takes 2/3 width on desktop */}
        <div className="lg:col-span-2 h-64">
          <RadarChart data={risks} />
        </div>

        {/* Risk Breakdown - Takes 1/3 width on desktop */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-center">
            <RiskGauge score={risks.overallScore} />
          </div>
          
          <div className="space-y-3">
            {Object.entries(risks.categories).map(([category, score]) => (
              <RiskCategoryBar 
                key={category}
                category={category}
                score={score}
                maxScore={10}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Critical Findings Section */}
      {risks.criticalItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-red-500 mb-2">Critical Findings</h3>
          <ul className="space-y-2">
            {risks.criticalItems.map((item: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-blue-800 dark:text-blue-200 font-medium">
          <b>Want to reduce your app's risk?</b> See actionable remediation and optimization suggestions on the <span className="underline cursor-pointer text-blue-600 dark:text-blue-300" onClick={() => window.location.href='/PermissionOptimization'}>Optimization</span> page.
        </p>
      </div>
    </motion.div>
  );
}

// Supporting Component
function RiskCategoryBar({ category, score, maxScore }: { category: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const color = percentage > 70 ? 'bg-red-500' : 
               percentage > 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize">{category.replace('_', ' ')}</span>
        <span>{score.toFixed(1)}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}