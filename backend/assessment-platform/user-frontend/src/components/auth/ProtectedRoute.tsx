import { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, Role } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRole?: Role;
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const hasCandidateToken = typeof window !== 'undefined' && !!localStorage.getItem('candidate_token');

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen font-body-main text-secondary">Loading...</div>;
  }

  // Allow Intern access if candidate_token is present in localStorage
  if (allowedRole === 'intern' && (hasCandidateToken || (user && user.role === 'intern'))) {
    return children ? <>{children}</> : <Outlet />;
  }

  // If no user and no candidate token, redirect to login
  if (!user && !hasCandidateToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user && user.role !== allowedRole) {
    if (user.role === 'authority') {
      return <Navigate to="/authority/dashboard" replace />;
    } else {
      return <Navigate to="/intern/interview/overview" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
