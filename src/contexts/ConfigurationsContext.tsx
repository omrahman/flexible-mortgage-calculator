import { ReactNode } from 'react';
import { useSavedConfigurations } from '../hooks/useSavedConfigurations';
import { ConfigurationsContext } from './ConfigurationsContextDefinition';

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
