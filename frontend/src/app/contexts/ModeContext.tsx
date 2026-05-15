import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserMode = 'paramedic' | 'hospital' | 'patient' | null;

interface ModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  isHydrated: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // localStorage에서 mode 복원
  useEffect(() => {
    const stored = localStorage.getItem('supersave_mode');
    if (stored === 'paramedic' || stored === 'hospital' || stored === 'patient') {
      setModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // mode가 바뀔 때 localStorage에 저장
  const setMode = (newMode: UserMode) => {
    if (newMode === mode) return; // 이미 같은 모드면 업데이트 하지 않음
    setModeState(newMode);
    if (newMode) {
      localStorage.setItem('supersave_mode', newMode);
    } else {
      localStorage.removeItem('supersave_mode');
    }
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, isHydrated }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}
