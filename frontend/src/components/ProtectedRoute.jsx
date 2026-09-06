import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './ui/LoadingState';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();

  if (loading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/customer/home" replace />;
  }

  if (!isAdmin && user && (!user.email || !user.email_verified)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
