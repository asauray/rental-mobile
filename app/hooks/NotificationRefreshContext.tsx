import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const NotificationRefreshContext = createContext<NotificationRefreshContextType | undefined>(undefined);

interface NotificationRefreshProviderProps {
  children: ReactNode;
}

export const NotificationRefreshProvider: React.FC<NotificationRefreshProviderProps> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <NotificationRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </NotificationRefreshContext.Provider>
  );
};

export const useNotificationRefresh = () => {
  const context = useContext(NotificationRefreshContext);
  if (context === undefined) {
    throw new Error('useNotificationRefresh must be used within a NotificationRefreshProvider');
  }
  return context;
};
