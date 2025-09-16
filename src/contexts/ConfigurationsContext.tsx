import { createContext, useContext, ReactNode } from 'react';
import { useSavedConfigurations } from '../hooks/useSavedConfigurations';
import { SavedConfiguration, CachedInputs } from '../types';

interface ConfigurationsContextType {
  configurations: SavedConfiguration[];
  saveConfiguration: (name: string, description: string, inputs: CachedInputs) => string;
  updateConfiguration: (id: string, name: string, description: string, inputs: CachedInputs) => void;
  deleteConfiguration: (id: string) => void;
  getConfiguration: (id: string) => SavedConfiguration | undefined;
}

const ConfigurationsContext = createContext<ConfigurationsContextType | undefined>(undefined);

interface ConfigurationsProviderProps {
  children: ReactNode;
}

export function ConfigurationsProvider({ children }: ConfigurationsProviderProps) {
  const configurationsData = useSavedConfigurations();

  return (
    <ConfigurationsContext.Provider value={configurationsData}>
      {children}
    </ConfigurationsContext.Provider>
  );
}

export function useConfigurations() {
  const context = useContext(ConfigurationsContext);
  if (context === undefined) {
    throw new Error('useConfigurations must be used within a ConfigurationsProvider');
  }
  return context;
}
