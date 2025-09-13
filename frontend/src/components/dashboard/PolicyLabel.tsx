// src/components/dashboard/PolicyLabel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useState } from 'react';

export function PolicyLabel({ policy }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 border border-opacity-10 border-white"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <FiAlertTriangle className="text-yellow-500" />
          Data Collection Summary
        </h2>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
        >
          {expanded ? (
            <>
              <span className="text-sm">Collapse</span>
              <FiChevronUp size={18} />
            </>
          ) : (
            <>
              <span className="text-sm">Expand</span>
              <FiChevronDown size={18} />
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {policy.dataCategories.slice(0, expanded ? policy.dataCategories.length : 3).map(category => (
          <div key={category.name} className="category-item">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium dark:text-gray-200">{category.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                category.risk > 7 ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                category.risk > 4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
              }`}>
                {category.risk.toFixed(1)}/10 Risk
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  category.risk > 7 ? 'bg-red-500' :
                  category.risk > 4 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${category.risk * 10}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{category.purpose || 'No purpose specified'}</span>
              <span>{category.sharedWith || 'Not shared'}</span>
            </div>
          </div>
        ))}
      </div>

      {policy.dataCategories.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 mx-auto"
        >
          {expanded ? 'Show Less' : `Show All (${policy.dataCategories.length})`}
        </button>
      )}

      {policy.lastUpdated && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(policy.lastUpdated).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}