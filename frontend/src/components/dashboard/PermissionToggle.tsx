// src/components/dashboard/PermissionToggle.tsx
import { motion } from 'framer-motion';
import { FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import { Tooltip } from '../ui/Tooltip';

interface Permission {
  name: string;
  description: string;
  risk: number;
  enabled: boolean;
  remediation: string;
}

interface PermissionToggleProps {
  permission: Permission;
  onToggle: (permission: Permission) => void;
}

export function PermissionToggle({ permission, onToggle, ...props }: PermissionToggleProps) {
  const riskLevel = permission.risk > 7 ? 'high' : 
                   permission.risk > 4 ? 'medium' : 'low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`permission-card p-4 rounded-lg transition-all ${
        riskLevel === 'high' ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20' :
        riskLevel === 'medium' ? 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
        'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20'
      }`}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {permission.name}
            </h3>
            {riskLevel === 'high' && (
              <FiAlertCircle color="#EF4444" size={18} />
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {permission.description}
          </p>
          
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full ${
              riskLevel === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
              riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
            }`}>
              {riskLevel.toUpperCase()} RISK
            </span>
            
            <Tooltip content={permission.remediation}>
              <span className="text-gray-400 hover:text-blue-500 cursor-help">
                <FiHelpCircle size={18} color="#9CA3AF" />
              </span>
            </Tooltip>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={!permission.enabled}
            onChange={() => onToggle(permission)}
          />
          <div className={`w-11 h-6 rounded-full peer ${
            riskLevel === 'high' ? 'bg-red-500/30 peer-checked:bg-red-500' :
            riskLevel === 'medium' ? 'bg-yellow-500/30 peer-checked:bg-yellow-500' :
            'bg-green-500/30 peer-checked:bg-green-500'
          } peer-focus:outline-none transition-colors`}>
            <div className={`absolute top-0.5 left-[2px] ${
              permission.enabled ? 'translate-x-0' : 'translate-x-5'
            } bg-white w-5 h-5 rounded-full transition-transform shadow-md`} />
          </div>
        </label>
      </div>
    </motion.div>
  );
}