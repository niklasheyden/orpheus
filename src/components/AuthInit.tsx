import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthInitProps {
  children: React.ReactNode;
}

const AuthInit = ({ children }: AuthInitProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    // Wait for the session to be initialized
    if (session !== undefined) {
      setIsLoading(false);
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F15] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-400"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInit; 