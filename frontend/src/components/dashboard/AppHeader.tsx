import { RiskBadge } from './RiskBadge';
import { motion } from 'framer-motion';
import { FiInfo, FiDownload, FiShare2, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface AppProps {
  name: string;
  icon: string;
  verified: boolean;
  package: string;
  version: string;
  riskScore: number;
}

interface AppHeaderProps {
  app: AppProps;
}

export function AppHeader({ app }: AppHeaderProps) {
  const navigate = useNavigate();

  const getRiskLevel = (score: number) => {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  };

  const riskLevel = getRiskLevel(app.riskScore);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 mb-6 border border-opacity-10 border-white"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* App Info Section */}
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <img 
              src={app.icon} 
              className="w-16 h-16 rounded-xl shadow-lg object-cover"
              alt={app.name}
            />
            {app.verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <FiCheck color="white" size={12} />
              </div>
            )}
          </motion.div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {app.name}
              </h1>
              <button className="text-gray-400 hover:text-blue-500 transition-colors">
                <FiInfo size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 font-mono">{app.package}</span>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                v{app.version}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <RiskBadge level={riskLevel} score={app.riskScore} />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
            onClick={() => navigate('/scan')}
          >
            <FiDownload size={16} />
            <span>Scan App</span>
          </motion.button>
          
          <button className="p-2 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <FiShare2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}