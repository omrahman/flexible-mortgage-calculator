import { useState } from 'react';
import { useSavedConfigurations, SavedConfiguration } from '../hooks/useSavedConfigurations';
import { ConfigurationModal } from './ConfigurationModal';

interface SavedConfigurationsProps {
  onLoadConfiguration: (config: SavedConfiguration) => void;
  loadedConfigurationId?: string | null;
}

export function SavedConfigurations({ onLoadConfiguration, loadedConfigurationId }: SavedConfigurationsProps) {
  const { configurations, deleteConfiguration } = useSavedConfigurations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SavedConfiguration | null>(null);

  const handleLoad = (config: SavedConfiguration) => {
    onLoadConfiguration(config);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      deleteConfiguration(id);
    }
  };

  const handleEdit = (config: SavedConfiguration) => {
    setEditingConfig(config);
    setIsModalOpen(true);
  };

  const handleSave = (name: string) => {
    if (editingConfig) {
      // Update existing configuration
      const updatedConfig = { ...editingConfig, name };
      onLoadConfiguration(updatedConfig);
      setEditingConfig(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Saved Configurations</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save Current
        </button>
      </div>

      {configurations.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No saved configurations yet.</p>
      ) : (
        <div className="space-y-2">
          {configurations.map((config) => (
            <div
              key={config.id}
              className={`flex items-center justify-between p-3 border rounded-md ${
                loadedConfigurationId === config.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {config.name}
                </p>
                <p className="text-xs text-gray-500">
                  ${config.principal.toLocaleString()} • {config.rate}% • {config.termYears} years
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(config.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={() => handleLoad(config)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Load
                </button>
                <button
                  onClick={() => handleEdit(config)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfigurationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        configuration={editingConfig}
      />
    </div>
  );
}
