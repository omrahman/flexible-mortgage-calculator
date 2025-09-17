import { useContext } from 'react';
import { ConfigurationsContext } from '../contexts/ConfigurationsContextDefinition';
import { importFromJSON, exportToJSON } from '../utils/serialization';


export function useConfigurations() {
  const context = useContext(ConfigurationsContext);
  if (!context) {
    throw new Error('useConfigurations must be used within a ConfigurationsProvider');
  }

  const exportConfiguration = (id: string) => {
    const config = context.configurations.find(c => c.id === id);
    if (config) {
      return exportToJSON(config.inputs, {
        includeMetadata: true,
        includeDisplaySettings: true,
      });
    }
    return null;
  };

  const importConfiguration = (json: string) => {
    return importFromJSON(json, { validateSchema: true });
  };

  return {
    ...context,
    importConfiguration,
    exportConfiguration,
  };
}
