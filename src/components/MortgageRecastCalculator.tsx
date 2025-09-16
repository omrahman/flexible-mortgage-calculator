import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
import { useSavedConfigurations } from '../hooks/useSavedConfigurations';
import { LoanInputs } from './LoanInputs';
import { ExtraPayments } from './ExtraPayments';
import { SummarySection } from './SummarySection';
import { BalanceChart } from './BalanceChart';
import { AmortizationTable } from './AmortizationTable';
import { SavedConfigurations } from './SavedConfigurations';
import { csvFor, downloadCSV } from '../utils/csv';
import { CSV_FILENAME } from '../constants';
import type { CachedInputs } from '../types';

export default function MortgageRecastCalculator() {
  const {
    // State
    principal,
    setPrincipal,
    rate,
    setRate,
    termYears,
    setTermYears,
    startYM,
    setStartYM,
    extras,
    autoRecast,
    setAutoRecast,
    recastMonthsText,
    setRecastMonthsText,
    showAll,
    setShowAll,
    
    // Computed values
    result,
    baseline,
    interestSaved,
    monthsSaved,
    
    // Handlers
    handleAddExtra,
    handleRemoveExtra,
    handleUpdateExtra,
    clearAllInputs,
    loadConfiguration,
    clearLoadedConfiguration,
    
    // State
    loadedConfigurationId,
  } = useMortgageCalculation();

  const {
    configurations,
    saveConfiguration,
    updateConfiguration,
    deleteConfiguration,
  } = useSavedConfigurations();

  const handleDownloadCSV = () => {
    downloadCSV(csvFor(result.rows), CSV_FILENAME);
  };

  // Current inputs for saving/loading configurations
  const currentInputs: CachedInputs = {
    principal,
    rate,
    termYears,
    startYM,
    extras,
    autoRecast,
    recastMonthsText,
    showAll,
  };

  const handleSaveConfiguration = async (name: string, description?: string) => {
    try {
      await saveConfiguration(name, description || '', currentInputs);
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  const handleLoadConfiguration = async (config: any) => {
    try {
      await loadConfiguration(config.inputs, config.id);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  const handleUpdateConfiguration = async (id: string, name: string, description: string, inputs: CachedInputs) => {
    try {
      await updateConfiguration(id, name, description, inputs);
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      await deleteConfiguration(id);
    } catch (error) {
      console.error('Error deleting configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  // Get the currently loaded configuration
  const loadedConfiguration = loadedConfigurationId 
    ? configurations.find(config => config.id === loadedConfigurationId)
    : null;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <LoanInputs
            principal={principal}
            setPrincipal={setPrincipal}
            rate={rate}
            setRate={setRate}
            termYears={termYears}
            setTermYears={setTermYears}
            startYM={startYM}
            setStartYM={setStartYM}
            onReset={clearAllInputs}
          />

          <ExtraPayments
            extras={extras}
            termMonths={result.rows.length > 0 ? Math.max(...result.rows.map(r => r.idx)) : 360}
            autoRecast={autoRecast}
            setAutoRecast={setAutoRecast}
            recastMonthsText={recastMonthsText}
            setRecastMonthsText={setRecastMonthsText}
            onAddExtra={handleAddExtra}
            onRemoveExtra={handleRemoveExtra}
            onUpdateExtra={handleUpdateExtra}
          />

          <SavedConfigurations
            configurations={configurations}
            onLoadConfiguration={handleLoadConfiguration}
            onSaveConfiguration={handleSaveConfiguration}
            onDeleteConfiguration={handleDeleteConfiguration}
            onUpdateConfiguration={handleUpdateConfiguration}
            currentInputs={currentInputs}
            loadedConfiguration={loadedConfiguration}
            onClearLoadedConfiguration={clearLoadedConfiguration}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          <SummarySection
            baseline={baseline}
            result={result}
            interestSaved={interestSaved}
            monthsSaved={monthsSaved}
          />

          <BalanceChart chartData={result.chart} />

          <AmortizationTable
            rows={result.rows}
            showAll={showAll}
            onToggleShowAll={() => setShowAll(!showAll)}
            onDownloadCSV={handleDownloadCSV}
          />
        </div>
      </div>
    </div>
  );
}