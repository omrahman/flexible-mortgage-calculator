import React, { useState } from 'react';
import { SavedConfiguration } from '../types';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
  onUpdate?: (id: string, name: string, description?: string) => void;
  configuration?: SavedConfiguration | null;
}

export function ConfigurationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate, 
  configuration
}: ConfigurationModalProps) {
  const [name, setName] = useState(configuration?.name || '');
  const [description, setDescription] = useState(configuration?.description || '');

  React.useEffect(() => {
    if (configuration) {
      setName(configuration.name);
      setDescription(configuration.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [configuration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (configuration && onUpdate) {
        onUpdate(configuration.id, name.trim(), description.trim() || undefined);
      } else {
        onSave(name.trim(), description.trim() || undefined);
      }
      setName('');
      setDescription('');
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
          
          <div className="mb-4">
            <label htmlFor="config-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="config-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a description for this configuration"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {configuration ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
