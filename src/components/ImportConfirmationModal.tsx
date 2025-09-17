import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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

  if (!configData) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h2"
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Confirm Import
                </Dialog.Title>
                
                <div className="mt-4 mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      rows={2}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end gap-3">
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
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50"
                    >
                      Save Imported Configuration
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
