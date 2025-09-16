import { useContext } from 'react';
import { ConfigurationsContext } from '../contexts/ConfigurationsContextDefinition';

export function useConfigurations() {
  const context = useContext(ConfigurationsContext);
  if (context === undefined) {
    throw new Error('useConfigurations must be used within a ConfigurationsProvider');
  }
  return context;
}
