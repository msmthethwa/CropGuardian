import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionManager } from '../utils/subscription';
import { SubscriptionTier, SubscriptionStatus } from '../utils/subscription';

interface SubscriptionContextType {
  subscription: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    expiryDate?: Date;
  };
  loading: boolean;
  hasPremiumAccess: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscription, setSubscription] = useState({
    tier: 'free' as SubscriptionTier,
    status: 'active' as SubscriptionStatus,
  });
  const [loading, setLoading] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  const refreshSubscription = async () => {
    setLoading(true);
    try {
      const userSubscription = await SubscriptionManager.getUserSubscription();
      setSubscription(userSubscription);
      const hasAccess = await SubscriptionManager.hasPremiumAccess();
      setHasPremiumAccess(hasAccess);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  const contextValue: SubscriptionContextType = {
    subscription,
    loading,
    hasPremiumAccess,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
