'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { MITRETechnique } from '@/lib/learning/mitre-knowledge';
import { getTechniqueById } from '@/lib/learning/mitre-knowledge';

interface LearningContextType {
  learningModeEnabled: boolean;
  setLearningModeEnabled: (enabled: boolean) => void;
  viewedTechniques: Set<string>;
  markTechniqueViewed: (techniqueId: string) => void;
  currentTechnique: MITRETechnique | null;
  openTechnique: (techniqueId: string) => void;
  closeTechnique: () => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [learningModeEnabled, setLearningModeEnabledState] = useState(true);
  const [viewedTechniques, setViewedTechniques] = useState<Set<string>>(new Set());
  const [currentTechnique, setCurrentTechnique] = useState<MITRETechnique | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('learning_mode_enabled');
    if (saved !== null) {
      setLearningModeEnabledState(saved === 'true');
    }

    const savedViewed = localStorage.getItem('viewed_techniques');
    if (savedViewed) {
      try {
        const parsed = JSON.parse(savedViewed) as string[];
        setViewedTechniques(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse viewed techniques:', e);
      }
    }
  }, []);

  const setLearningModeEnabled = (enabled: boolean) => {
    setLearningModeEnabledState(enabled);
    localStorage.setItem('learning_mode_enabled', enabled.toString());
  };

  const markTechniqueViewed = (techniqueId: string) => {
    setViewedTechniques(prev => {
      const newSet = new Set(prev);
      newSet.add(techniqueId);
      localStorage.setItem('viewed_techniques', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const openTechnique = (techniqueId: string) => {
    const technique = getTechniqueById(techniqueId);
    if (technique) {
      setCurrentTechnique(technique);
      markTechniqueViewed(techniqueId);
    }
  };

  const closeTechnique = () => {
    setCurrentTechnique(null);
  };

  return (
    <LearningContext.Provider
      value={{
        learningModeEnabled,
        setLearningModeEnabled,
        viewedTechniques,
        markTechniqueViewed,
        currentTechnique,
        openTechnique,
        closeTechnique
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}

