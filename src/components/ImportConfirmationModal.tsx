import { useState, useEffect } from 'react';
import { LoanConfigurationSchema } from '../types';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description?: string) => void;
  configData: LoanConfigurationSchema | null;
}

export function ImportConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  configData 
}: ImportConfirmationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (configData) {
      setName(`Imported ${new Date().toLocaleDateString()}`);
      setDescription(configData.metadata?.description || '');
    }
  }, [configData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim(), description.trim() || undefined);
      onClose();
    }
  };

  if (!isOpen || !configData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Confirm Import</h2>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Configuration Details</h4>
          <p className="text-sm text-gray-600">
            <strong>Home Price:</strong> ${configData.loan.homePrice}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Interest Rate:</strong> {configData.loan.interestRate}%
          </p>
          <p className="text-sm text-gray-600">
            <strong>Term:</strong> {configData.loan.termYears} years
          </p>
          {configData.metadata?.description && (
             <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
              <strong>Description:</strong> {configData.metadata.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="import-config-name" className="block text-sm font-medium text-gray-700 mb-2">
              Save as
            </label>
            <input
              id="import-config-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="import-config-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="import-config-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-3">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Save Imported Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
