import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiUpload } from 'react-icons/fi';

interface PolicyAnalysisResult {
  summary: string;
  categories: {
    [key: string]: string[];
  };
  risk_scores: {
    [key: string]: number;
  };
  overall_risk: number;
}

export function PolicyAnalyzer() {
  const [policyText, setPolicyText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<PolicyAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const analyzePolicyText = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:5000/api/scan/analyze-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: policyText }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze policy');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to analyze policy');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getRiskColor = (score: number) => {
    if (score >= 7) return 'text-red-500 dark:text-red-400';
    if (score >= 4) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4 dark:text-white">
        Privacy Policy Analyzer
      </h2>

      <div className="space-y-4">
        <textarea
          className="w-full h-48 p-4 rounded-lg border border-gray-300 dark:border-gray-600 
                     dark:bg-gray-800 dark:text-white resize-none focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent"
          placeholder="Paste your privacy policy text here..."
          value={policyText}
          onChange={(e) => setPolicyText(e.target.value)}
        />

        <button
          className="flex items-center justify-center gap-2 w-full py-2 px-4 
                     bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors disabled:bg-gray-400"
          onClick={analyzePolicyText}
          disabled={!policyText.trim() || loading}
        >
          {loading ? (
            'Analyzing...'
          ) : (
            <>
              <FiUpload />
              Analyze Policy
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Summary</h3>
              <p className="text-gray-700 dark:text-gray-300">{analysisResult.summary}</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 dark:text-white">Risk Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysisResult.risk_scores).map(([category, score]) => (
                  <div
                    key={category}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium dark:text-white">
                        {category.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h4>
                      <span className={`font-bold ${getRiskColor(score)}`}>
                        {score.toFixed(1)}/10
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 7 ? 'bg-red-500' :
                          score >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${score * 10}%` }}
                      />
                    </div>

                    {analysisResult.categories[category].length > 0 && (
                      <button
                        onClick={() => toggleCategory(category)}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700 
                                 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        {expandedCategories.includes(category) ? (
                          <>
                            <FiChevronUp />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <FiChevronDown />
                            Show Details
                          </>
                        )}
                      </button>
                    )}

                    {expandedCategories.includes(category) && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        {analysisResult.categories[category].map((point, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold dark:text-white">Overall Risk Score</h3>
                <span className={`text-2xl font-bold ${getRiskColor(analysisResult.overall_risk)}`}>
                  {analysisResult.overall_risk.toFixed(1)}/10
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 