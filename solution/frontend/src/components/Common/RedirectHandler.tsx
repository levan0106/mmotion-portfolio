import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccount } from '../../contexts/AccountContext';

interface RedirectHandlerProps {
  children: React.ReactNode;
}

const RedirectHandler: React.FC<RedirectHandlerProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAccount } = useAccount();

  useEffect(() => {
    // Only redirect if we have account data and user is authenticated
    if (currentAccount && currentAccount.isInvestor) {
      // If user is investor and trying to access dashboard, redirect to investor view
      if (location.pathname === '/' || location.pathname === '/dashboard') {
        navigate('/investor', { replace: true });
      }
    }
  }, [currentAccount, location.pathname, navigate]);

  return <>{children}</>;
};

export default RedirectHandler;
