import {
  useState,
  useRef,
  useEffect
} from 'react';
import {
  useConfigurations
} from '../hooks/useConfigurations';
import {
  ConfigurationModal
} from './ConfigurationModal';
import {
  SavedConfiguration,
  CachedInputs,
  LoanConfigurationSchema,
  LoanSummary
} from '../types';
import {
  ImportConfirmationModal
} from './ImportConfirmationModal';
import {
  deserializeLoanConfiguration,
  exportToUrl
} from '../utils/serialization';
import {
  fmtUSD
} from '../utils/formatters';


interface SavedConfigurationsProps {
  onLoadConfiguration: (config: SavedConfiguration) => void;
  onClearLoadedConfiguration: () => void;
  loadedConfigurationId ? : string | null;
  currentInputs: CachedInputs;
  hasUnsavedChanges ? : boolean;
  onSaveChanges ? : (configId: string) => void;
  loanSummary ? : LoanSummary;
}

export function SavedConfigurations({
  onLoadConfiguration,
  onClearLoadedConfiguration,
  loadedConfigurationId,
  currentInputs,
  hasUnsavedChanges = false,
  onSaveChanges,
  loanSummary
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLoad = (config: SavedConfiguration) => {
    onLoadConfiguration(config);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      deleteConfiguration(id);
      if (id === loadedConfigurationId) {
        onClearLoadedConfiguration();
      }
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
      const config = configurations.find((c: SavedConfiguration) => c.id === id);
      a.download = `mortgage-config-${config?.name.replace(/\s/g, '_') || id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = (config: SavedConfiguration) => {
    const encoded = exportToUrl(config.inputs);
    const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    }, (err) => {
      console.error('Failed to copy share link: ', err);
      alert('Failed to copy share link.');
    });
    setOpenMenuId(null);
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

  const handleConfirmImport = (name: string, description ? : string) => {
    if (importedConfigData) {
      const inputsToSave = deserializeLoanConfiguration(importedConfigData);
      saveConfiguration(name, description || '', inputsToSave);
      setIsImportModalOpen(false);
      setImportedConfigData(null);
      alert('Configuration imported and saved successfully!');
    }
  };

  const handleSave = (name: string, description ? : string) => {
    if (editingConfig) {
      // Update existing configuration
      updateConfiguration(editingConfig.id, name, description || '', currentInputs, loanSummary);
      setEditingConfig(null);
    } else {
      // Save new configuration
      const newConfig = saveConfiguration(name, description || '', currentInputs, loanSummary);
      if (newConfig) {
        onLoadConfiguration(newConfig);
      }
    }
  };

  const handleUpdate = (id: string, name: string, description ? : string) => {
    updateConfiguration(id, name, description || '', currentInputs, loanSummary);
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

  const isSharedConfig = loadedConfigurationId && loadedConfigurationId.startsWith('shared-');

  return (
    <div>
      {isSharedConfig && (
        <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-md text-sm text-blue-700">
          You are viewing a shared configuration. Save it to keep it and any changes you make.
        </div>
      )}
      <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
          {hasUnsavedChanges && loadedConfigurationId && !isSharedConfig && (
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
                  <p className="text-xs text-gray-600 break-words leading-relaxed mt-1">
                    {config.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 break-words">
                  ${config.inputs.homePrice} • {config.inputs.rate}% • {config.inputs.termYears} years
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(config.createdAt).toLocaleDateString()}
                </p>

                {config.summary && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      {/* Core Loan & Payment Info */}
                      <SummaryItem label="Loan Amount" value={fmtUSD(config.summary.loanAmount)} />
                      <SummaryItem label="Original P&I" value={fmtUSD(config.summary.originalPI)} />
                      <SummaryItem label="Current P&I" value={fmtUSD(config.summary.currentPI)} />
                      <SummaryItem label="Original PITI" value={fmtUSD(config.summary.originalPITI)} />
                      <SummaryItem label="Current PITI" value={fmtUSD(config.summary.currentPITI)} />
                      <SummaryItem label="Payoff Date" value={config.summary.payoffDate} />
                      
                      {/* Savings */}
                      <SummaryItem label="Total Interest (Baseline)" value={fmtUSD(config.summary.totalInterestBaseline)} />
                      <SummaryItem label="Total Interest (Current)" value={fmtUSD(config.summary.totalInterestCurrent)} />
                      <SummaryItem label="Interest Saved" value={fmtUSD(config.summary.interestSaved)} highlight />
                      <SummaryItem label="Months Saved" value={config.summary.monthsSaved.toString()} highlight />
                      
                      {/* Payment Totals */}
                      <SummaryItem label="Total Paid" value={fmtUSD(config.summary.totalPaid)} />
                      <SummaryItem label="Total Principal Paid" value={fmtUSD(config.summary.totalPrincipalPaid)} />
                      <SummaryItem label="Total Extra Payments" value={fmtUSD(config.summary.totalExtraPayments)} highlight />
                      <SummaryItem label="Total Forgiveness" value={fmtUSD(config.summary.totalForgiveness)} highlight />

                      {/* Lender Metrics */}
                      <SummaryItem label="Lender's Profit" value={fmtUSD(config.summary.lenderProfit)} />
                      <SummaryItem label="Lender's ROI" value={`${typeof config.summary.lenderROI === 'number' ? config.summary.lenderROI.toFixed(2) : 'N/A'}%`} />
                    </dl>
                  </div>
                )}
              </div>
              
              <div className="relative ml-3"
                ref={openMenuId === config.id ? menuRef : null}>
                <button
                  onClick={() => setOpenMenuId(openMenuId === config.id ? null : config.id)}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Actions"
                  aria-haspopup="true"
                  aria-expanded={openMenuId === config.id}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                {openMenuId === config.id && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                  >
                    <div className="py-1" role="none">
                      <button 
                        onClick={() => { handleLoad(config); setOpenMenuId(null); }} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => { handleShare(config); }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Share
                      </button>
                      <button 
                        onClick={() => { handleEdit(config); setOpenMenuId(null); }} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => { handleDelete(config.id); setOpenMenuId(null); }} 
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900"
                        role="menuitem"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => { handleExport(config.id); setOpenMenuId(null); }}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-900"
                        role="menuitem"
                      >
                        Export
                      </button>
                    </div>
                  </div>
                )}
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

const SummaryItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <div className="grid grid-cols-[auto_1fr] gap-x-2 items-baseline">
    <dt className="text-gray-500">{label}</dt>
    <dd className={`font-medium ${highlight ? 'text-green-600' : 'text-gray-800'} text-right break-words`}>{value}</dd>
  </div>
);
