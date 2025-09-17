import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
                  {configuration ? 'Update Configuration' : 'Save Configuration'}
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="config-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Configuration Name
                    </label>
                    <input
                      id="config-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Enter a description for this configuration"
                      rows={3}
                    />
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-3 sm:justify-end">
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
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      {configuration ? 'Update' : 'Save'}
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
