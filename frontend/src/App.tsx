import { type ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import RiskAnalysis from './pages/RiskAnalysis';
import PolicyAnalysis from './pages/PolicyAnalysis';
import PermissionOptimization from './pages/PermissionOptimization';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { io } from 'socket.io-client';

// Protected Route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// New AppContent component to wrap logic that uses useLocation
const AppContent = () => {

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
      <Route path="/risk-analysis" element={<ProtectedRoute><RiskAnalysis /></ProtectedRoute>} />
      <Route path="/policy-analysis" element={<ProtectedRoute><PolicyAnalysis /></ProtectedRoute>} />
      <Route path="/permission-optimization" element={<PermissionOptimization />} />
    </Routes>
  );
};

const socket = io('http://localhost:5000'); // Adjust if backend runs elsewhere

function useScanNotification(currentUserId: string) {
  useEffect(() => {
    if (!currentUserId) return;
    socket.emit('join', { user_id: currentUserId });
    socket.on('scan_complete', (data: any) => {
      alert(`Scan complete for ${data.app_name}! Risk score: ${data.risk_score}`);
    });
    return () => {
      socket.off('scan_complete');
    };
  }, [currentUserId]);
}

function App() {
  useScanNotification('anonymous');
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent /> {/* Render AppContent inside BrowserRouter */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;