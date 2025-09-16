import React, { useState } from 'react';
import { SavedConfiguration } from '../hooks/useSavedConfigurations';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  configuration?: SavedConfiguration | null;
}

export function ConfigurationModal({ isOpen, onClose, onSave, configuration }: ConfigurationModalProps) {
  const [name, setName] = useState(configuration?.name || '');

  React.useEffect(() => {
    if (configuration) {
      setName(configuration.name);
    } else {
      setName('');
    }
  }, [configuration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">
          {configuration ? 'Update Configuration' : 'Save Configuration'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="config-name" className="block text-sm font-medium text-gray-700 mb-2">
              Configuration Name
            </label>
            <input
              id="config-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a name for this configuration"
              autoFocus
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {configuration ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
