import { useState, useEffect } from 'react';
import { useConfigurations } from '../contexts/ConfigurationsContext';
import { ConfigurationModal } from './ConfigurationModal';
import { SavedConfiguration, CachedInputs } from '../types';

interface SavedConfigurationsProps {
  onLoadConfiguration: (config: SavedConfiguration) => void;
  loadedConfigurationId?: string | null;
  currentInputs: CachedInputs;
  hasUnsavedChanges?: boolean;
  onSaveChanges?: (configId: string) => void;
}

export function SavedConfigurations({ 
  onLoadConfiguration, 
  loadedConfigurationId, 
  currentInputs, 
  hasUnsavedChanges = false, 
  onSaveChanges 
}: SavedConfigurationsProps) {
  const { configurations, saveConfiguration, updateConfiguration, deleteConfiguration } = useConfigurations();
  
  
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

  const handleSave = (name: string, description?: string) => {
    if (editingConfig) {
      // Update existing configuration
      updateConfiguration(editingConfig.id, name, description || '', currentInputs);
      setEditingConfig(null);
    } else {
      // Save new configuration
      saveConfiguration(name, description || '', currentInputs);
    }
  };

  const handleUpdate = (id: string, name: string, description?: string) => {
    updateConfiguration(id, name, description || '', currentInputs);
    setEditingConfig(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConfig(null);
  };

  const handleSaveChanges = () => {
    if (loadedConfigurationId && onSaveChanges) {
      onSaveChanges(loadedConfigurationId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Saved Configurations</h3>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && loadedConfigurationId && (
            <button
              onClick={handleSaveChanges}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              Save Changes
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Current
          </button>
        </div>
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
                  ? hasUnsavedChanges
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                  {config.name}
                  {loadedConfigurationId === config.id && hasUnsavedChanges && (
                    <span className="ml-2 text-orange-600 text-xs font-bold">●</span>
                  )}
                </p>
                {config.description && (
                  <p className="text-xs text-gray-600 truncate">
                    {config.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  ${config.inputs.principal} • {config.inputs.rate}% • {config.inputs.termYears} years
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
        onUpdate={handleUpdate}
        configuration={editingConfig}
      />
    </div>
  );
}
