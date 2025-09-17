import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { SavedConfiguration, CachedInputs, LoanSummary } from '../types';
import { exportToJSON, importFromJSON } from '../utils/serialization';
import { ConfigurationValidationResult } from '../types';

export function useSavedConfigurations() {
  const [configurations, setConfigurations] = useLocalStorage<SavedConfiguration[]>('mortgage-configurations', []);

  const saveConfiguration = useCallback((name: string, description: string, inputs: CachedInputs, summary?: LoanSummary) => {
    const newConfig: SavedConfiguration = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      inputs,
      summary,
    };
    
    setConfigurations(prev => [...prev, newConfig]);
    return newConfig;
  }, [setConfigurations]);

  const updateConfiguration = useCallback((id: string, name: string, description: string, inputs: CachedInputs, summary?: LoanSummary) => {
    setConfigurations(prev => 
      prev.map(config => 
        config.id === id 
          ? { 
              ...config, 
              name, 
              description, 
              inputs,
              summary,
              lastModified: new Date().toISOString()
            }
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

  const importConfiguration = useCallback((jsonString: string): ConfigurationValidationResult => {
    return importFromJSON(jsonString);
  }, []);

  const exportConfiguration = useCallback((id: string) => {
    const config = configurations.find(c => c.id === id);
    if (config) {
      return exportToJSON(config.inputs);
    }
    return null;
  }, [configurations]);

  return {
    configurations,
    saveConfiguration,
    updateConfiguration,
    deleteConfiguration,
    getConfiguration,
    importConfiguration,
    exportConfiguration,
  };
}
