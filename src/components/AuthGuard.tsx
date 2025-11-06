import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    // Synchronous check - no async needed
    const isAuth = authService.isAuthenticated();
    console.log('AuthGuard: User authenticated?', isAuth);
    
    setIsAuthenticated(isAuth);
    setIsLoading(false);
    
    // Only redirect if definitely not authenticated AND auth is required
    if (requireAuth && !isAuth) {
      console.log('AuthGuard: Not authenticated, redirecting to signin');
      navigate('/signin', { replace: true });
    }
  };

  // Show loading only briefly to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth required but not authenticated, don't render (will redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;