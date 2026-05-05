import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { NotificationToastContainer } from '@/components/NotificationToastContainer';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#0a192f', color: '#f87171', minHeight: '100vh' }}>
          <h2>App Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{(this.state.error as Error).message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#94a3b8' }}>{(this.state.error as Error).stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { ProtectedRoute, ClientRoute, FreelancerRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ClientDashboard from '@/pages/ClientDashboard';
import FreelancerDashboard from '@/pages/FreelancerDashboard';
import PostJob from '@/pages/PostJob';
import MyJobs from '@/pages/MyJobs';
import BrowseJobs from '@/pages/BrowseJobs';
import JobDetail from '@/pages/JobDetail';
import FreelancerInvites from '@/pages/FreelancerInvites';
import ClientInvites from '@/pages/ClientInvites';
import ClientJobBids from '@/pages/ClientJobBids';
import ClientBids from '@/pages/ClientBids';
import FreelancerBids from '@/pages/FreelancerBids';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import Contracts from '@/pages/Contracts';
import ArchivedJobs from '@/pages/ArchivedJobs';
import Payments from '@/pages/Payments';
import Reviews from '@/pages/Reviews';

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <NotificationProvider>
      <NotificationToastContainer />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/client/dashboard"
            element={<ClientRoute><ClientDashboard /></ClientRoute>}
          />
          <Route
            path="/freelancer/dashboard"
            element={<FreelancerRoute><FreelancerDashboard /></FreelancerRoute>}
          />

          <Route
            path="/client/post-job"
            element={<ClientRoute><PostJob /></ClientRoute>}
          />
          <Route
            path="/client/jobs"
            element={<ClientRoute><MyJobs /></ClientRoute>}
          />
          <Route
            path="/client/archived-jobs"
            element={<ClientRoute><ArchivedJobs /></ClientRoute>}
          />
          <Route
            path="/client/invites"
            element={<ClientRoute><ClientInvites /></ClientRoute>}
          />
          <Route
            path="/client/bids"
            element={<ClientRoute><ClientBids /></ClientRoute>}
          />
          <Route
            path="/client/jobs/:jobId/bids"
            element={<ClientRoute><ClientJobBids /></ClientRoute>}
          />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="/contracts/:contractId" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/browse" element={<BrowseJobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route
            path="/freelancer/invites"
            element={<FreelancerRoute><FreelancerInvites /></FreelancerRoute>}
          />
          <Route
            path="/freelancer/bids"
            element={<FreelancerRoute><FreelancerBids /></FreelancerRoute>}
          />

          {/* Legacy redirect */}
          <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
