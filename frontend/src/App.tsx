import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ClientRoute, FreelancerRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Register from '@/pages/Register';
import Login from '@/pages/Login';
import ClientDashboard from '@/pages/ClientDashboard';
import FreelancerDashboard from '@/pages/FreelancerDashboard';
import PostJob from '@/pages/PostJob';
import MyJobs from '@/pages/MyJobs';
import BrowseJobs from '@/pages/BrowseJobs';
import JobDetail from '@/pages/JobDetail';
import FreelancerInvites from '@/pages/FreelancerInvites';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

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
          <Route path="/browse" element={<BrowseJobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route
            path="/freelancer/invites"
            element={<FreelancerRoute><FreelancerInvites /></FreelancerRoute>}
          />

          {/* Legacy redirect */}
          <Route path="/dashboard" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
