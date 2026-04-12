'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserMode = 'simple' | 'developer';

type UserModeContextType = {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  isSimple: boolean;
  isDeveloper: boolean;
};

const UserModeContext = createContext<UserModeContextType | null>(null);

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>('developer');

  useEffect(() => {
    const savedMode = localStorage.getItem('qcrypt_user_mode') as UserMode | null;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem('qcrypt_user_mode', newMode);
  };

  return (
    <UserModeContext.Provider
      value={{
        mode,
        setMode,
        isSimple: mode === 'simple',
        isDeveloper: mode === 'developer',
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error('useUserMode must be used within UserModeProvider');
  }
  return context;
}
