import React from 'react';
import { AppHeader } from './AppHeader';
import { RiskAnalysis } from './RiskAnalysis';
import { PolicyLabel } from './PolicyLabel';
import { PermissionToggle } from './PermissionToggle';

interface DashboardProps {
  app: any; // Assuming 'app' prop is required for AppHeader
  risks: any; // Assuming 'risks' prop is required for RiskAnalysis
  policy: any; // Assuming 'policy' prop is required for PolicyLabel
  permission: any; // Assuming 'permission' prop is required for PermissionToggle
  onToggle: any; // Assuming 'onToggle' prop is required for PermissionToggle
}

const Dashboard: React.FC<DashboardProps> = ({ app, risks, policy, permission, onToggle }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <h2>Dashboard Content Test</h2>
      <AppHeader app={app} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Risk Analysis</h2>
            <RiskAnalysis risks={risks} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Policy Labels</h2>
            {/* <PolicyLabel policy={policy} /> */}
          </div>
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Permission Settings</h2>
            <PermissionToggle permission={permission} onToggle={onToggle} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 