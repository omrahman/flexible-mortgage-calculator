import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface SavedConfiguration {
  id: string;
  name: string;
  principal: number;
  rate: number;
  termYears: number;
  startYM: string;
  extraPayments: Array<{
    month: number;
    amount: number;
  }>;
  autoRecast: boolean;
  recastMonthsText: string;
  showAll: boolean;
  createdAt: Date;
}

export function useSavedConfigurations() {
  const [configurations, setConfigurations] = useLocalStorage<SavedConfiguration[]>('mortgage-configurations', []);

  const saveConfiguration = useCallback((config: Omit<SavedConfiguration, 'id' | 'createdAt'>) => {
    const newConfig: SavedConfiguration = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    
    setConfigurations(prev => [...prev, newConfig]);
    return newConfig.id;
  }, [setConfigurations]);

  const updateConfiguration = useCallback((id: string, updates: Partial<Omit<SavedConfiguration, 'id' | 'createdAt'>>) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === id 
          ? { ...config, ...updates }
          : config
      )
    );
  }, [setConfigurations]);

  const deleteConfiguration = useCallback((id: string) => {
    setConfigurations(prev => prev.filter(config => config.id !== id));
  }, [setConfigurations]);

  const getConfiguration = useCallback((id: string) => {
    return configurations.find(config => config.id === id);
  }, [configurations]);

  return {
    configurations,
    saveConfiguration,
    updateConfiguration,
    deleteConfiguration,
    getConfiguration,
  };
}
