import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ShieldCheck } from 'lucide-react';

import Register from './pages/Register';
import Login from './pages/Login';
import VerifyDocuments from './pages/VerifyDocuments';
import VideoKYC from './pages/VideoKYC';
import Credential from './pages/Credential';
import Share from './pages/Share';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children, requireRegistered, requireLoggedIn, requireCredential }) => {
  const { isRegistered, isLoggedIn, hasCredential, loading } = useAuth();

  if (loading) return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner" style={{ borderColor: 'var(--primary-color)' }}></div></div>;

  if (requireCredential && !hasCredential) return <Navigate to="/register" replace />;
  if (requireLoggedIn && !isLoggedIn) return <Navigate to="/login" replace />;
  if (requireRegistered && !isRegistered) return <Navigate to="/register" replace />;

  return children;
};

const TopBar = () => {
  const location = useLocation();
  const isVerifyRoute = location.pathname.startsWith('/verify/');
  
  return (
    <div className="top-bar">
      <div className="top-bar-logo">
        <ShieldCheck size={24} color="var(--primary-color)" />
        <span>TrustID</span>
      </div>
      {isVerifyRoute && (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Step {location.pathname.includes('documents') ? '1' : location.pathname.includes('video-kyc') ? '2' : '3'} of 3
        </div>
      )}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <>
      <TopBar />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/login" 
            element={
              <ProtectedRoute requireRegistered>
                <Login />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify/documents" 
            element={
              <ProtectedRoute requireLoggedIn>
                <VerifyDocuments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify/video-kyc" 
            element={
              <ProtectedRoute requireLoggedIn>
                <VideoKYC />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/verify/credential" 
            element={
              <ProtectedRoute requireLoggedIn>
                <Credential />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/share" 
            element={
              <ProtectedRoute requireCredential>
                <Share />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireCredential>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--primary-color)' }}>
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'white' }}>
          <ShieldCheck size={64} />
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>TrustID</h1>
          <p style={{ opacity: 0.8 }}>Secure Identity Verification</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container animate-fade-in">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
};

export default App;
