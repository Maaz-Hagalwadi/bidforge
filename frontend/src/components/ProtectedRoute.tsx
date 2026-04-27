import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface Props {
  children: React.ReactNode;
}

function Spinner() {
  return (
    <div className="min-h-screen bg-dark-navy flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-secondary text-4xl">
        progress_activity
      </span>
    </div>
  );
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Only allows CLIENT role — redirects freelancers to their dashboard. */
export function ClientRoute({ children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'CLIENT') return <Navigate to="/freelancer/dashboard" replace />;
  return <>{children}</>;
}

/** Only allows FREELANCER role — redirects clients to their dashboard. */
export function FreelancerRoute({ children }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'FREELANCER') return <Navigate to="/client/dashboard" replace />;
  return <>{children}</>;
}
