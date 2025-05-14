
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';
import { auth, User } from '@/lib/firebase'; // Using auth for user state

interface AppContextType {
  isDataFromCsv: boolean;
  setIsDataFromCsv: React.Dispatch<React.SetStateAction<boolean>>;
  isAppInitialized: boolean; // True if users exist (app has been set up)
  setIsAppInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingStatus: boolean;
  currentUser: User | null; // Add current user to context
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDataFromCsv, setIsDataFromCsv] = useState(false);
  const [isAppInitialized, setIsAppInitialized] = useState(false); // Assume not initialized until checked
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      // If user logs out, we might want to re-check app initialization status
      // or assume it's still initialized if it was before.
      // For now, user change primarily affects currentUser in context.
      // App initialization (hasUsers) is more about the backend state.
      if (!user && !isAppInitialized) { // If logged out and app wasn't initialized, re-check
        fetchAppStatus();
      } else if (user && !isAppInitialized) { // If logged in and app status unknown, check
        fetchAppStatus();
      } else if (!user && isAppInitialized) {
        // User logged out, but app was initialized. Keep isAppInitialized true.
        // Could also fetch status again if desired.
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAppInitialized]); // Re-run if isAppInitialized changes

  const fetchAppStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await apiClient<{ isSeededByCsv: boolean; hasUsers: boolean }>('/data/app-status');
      setIsDataFromCsv(status.isSeededByCsv);
      setIsAppInitialized(status.hasUsers);
    } catch (error) {
      console.error("Failed to fetch app status:", error);
      // Default to false, prompting setup/login
      setIsDataFromCsv(false);
      setIsAppInitialized(false);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchAppStatus();
  }, []);


  return (
    <AppContext.Provider value={{ 
        isDataFromCsv, setIsDataFromCsv, 
        isAppInitialized, setIsAppInitialized,
        isLoadingStatus,
        currentUser 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
