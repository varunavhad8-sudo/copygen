import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading, sessionExpired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && sessionExpired) {
      navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
    }
  }, [loading, user, sessionExpired, navigate]);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050508',
        color: '#c9a84c'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;



