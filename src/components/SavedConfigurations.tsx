import { useState } from 'react';
import { useConfigurations } from '../hooks/useConfigurations';
import { ConfigurationModal } from './ConfigurationModal';
import { SavedConfiguration, CachedInputs, LoanConfigurationSchema } from '../types';
import { useRef } from 'react';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { deserializeLoanConfiguration } from '../utils/serialization';

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
  const { 
    configurations, 
    saveConfiguration, 
    updateConfiguration, 
    deleteConfiguration,
    importConfiguration,
    exportConfiguration,
  } = useConfigurations();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SavedConfiguration | null>(null);
  const [importedConfigData, setImportedConfigData] = useState<LoanConfigurationSchema | null>(null);

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

  const handleExport = (id: string) => {
    const json = exportConfiguration(id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const config = configurations.find(c => c.id === id);
      a.download = `mortgage-config-${config?.name.replace(/\s/g, '_') || id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const validationResult = importConfiguration(text);
        
        if (validationResult.isValid && validationResult.data) {
          setImportedConfigData(validationResult.data);
          setIsImportModalOpen(true);
        } else {
          console.error('Import failed', validationResult.errors);
          alert(`Failed to import configuration: ${validationResult.errors?.join(', ')}`);
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleConfirmImport = (name: string, description?: string) => {
    if (importedConfigData) {
      const inputsToSave = deserializeLoanConfiguration(importedConfigData);
      saveConfiguration(name, description, inputsToSave);
      setIsImportModalOpen(false);
      setImportedConfigData(null);
      alert('Configuration imported and saved successfully!');
    }
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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved Configurations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
          {hasUnsavedChanges && loadedConfigurationId && (
            <button
              onClick={handleSaveChanges}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors whitespace-nowrap"
            >
              Save Changes
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Save Current
          </button>
          <button
            onClick={handleImportClick}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/json"
          />
        </div>
      </div>

      {configurations.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No saved configurations yet.</p>
      ) : (
        <div className="space-y-2">
          {configurations.map((config: SavedConfiguration) => (
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
                <p className="text-sm font-medium text-gray-900 break-words flex items-center gap-2">
                  <span className="truncate">{config.name}</span>
                  {loadedConfigurationId === config.id && hasUnsavedChanges && (
                    <span className="text-orange-600 text-xs font-bold flex-shrink-0">●</span>
                  )}
                </p>
                {config.description && (
                  <p className="text-xs text-gray-600 break-words leading-relaxed">
                    {config.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 break-words">
                  ${config.inputs.homePrice} • {config.inputs.rate}% • {config.inputs.termYears} years
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(config.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-2 ml-3 min-w-0">
                <button
                  onClick={() => handleLoad(config)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
                >
                  Load
                </button>
                <button
                  onClick={() => handleEdit(config)}
                  className="text-gray-600 hover:text-gray-800 text-sm whitespace-nowrap"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="text-red-600 hover:text-red-800 text-sm whitespace-nowrap"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleExport(config.id)}
                  className="text-green-600 hover:text-green-800 text-sm whitespace-nowrap"
                >
                  Export
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

      <ImportConfirmationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
        configData={importedConfigData}
      />
    </div>
  );
}
