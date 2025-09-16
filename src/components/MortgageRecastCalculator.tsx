import { useMemo } from 'react';
import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
import { useConfigurations } from '../contexts/ConfigurationsContext';
import { LoanInputs } from './LoanInputs';
import { ExtraPayments } from './ExtraPayments';
import { SummarySection } from './SummarySection';
import { BalanceChart } from './BalanceChart';
import { AmortizationTable } from './AmortizationTable';
import { SavedConfigurations } from './SavedConfigurations';
import { csvFor, downloadCSV } from '../utils/csv';
import { CSV_FILENAME } from '../constants';

export default function MortgageRecastCalculator() {
  const {
    // State
    homePrice,
    setHomePrice,
    downPayment,
    setDownPayment,
    rate,
    setRate,
    termYears,
    setTermYears,
    startYM,
    setStartYM,
    propertyTaxAnnual,
    setPropertyTaxAnnual,
    insuranceAnnual,
    setInsuranceAnnual,
    extras,
    autoRecast,
    setAutoRecast,
    recastMonthsText,
    setRecastMonthsText,
    showAll,
    setShowAll,
    
    // Computed values
    monthlyPITI,
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
    markChangesAsSaved,
    
    // State
    loadedConfigurationId,
    hasUnsavedChanges,
  } = useMortgageCalculation();

  const { updateConfiguration, getConfiguration } = useConfigurations();

  const handleDownloadCSV = () => {
    downloadCSV(csvFor(result.rows), CSV_FILENAME);
  };

  const handleLoadConfiguration = async (config: any) => {
    try {
      // Convert SavedConfiguration to CachedInputs format
      const cachedInputs = config.inputs;
      await loadConfiguration(cachedInputs, config.id);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  const handleSaveChanges = (configId: string) => {
    // Get the current configuration to preserve name and description
    const currentConfig = getConfiguration(configId);
    
    if (currentConfig) {
      // Update the configuration with current inputs while preserving name and description
      updateConfiguration(
        configId,
        currentConfig.name,
        currentConfig.description || '',
        currentInputs
      );
      
      // Mark changes as saved to reset the unsaved changes indicator
      markChangesAsSaved();
    }
  };

  // Get current inputs for saving
  const currentInputs = useMemo(() => ({
    homePrice,
    downPayment,
    rate,
    termYears,
    startYM,
    propertyTaxAnnual,
    insuranceAnnual,
    extras,
    autoRecast,
    recastMonthsText,
    showAll,
  }), [homePrice, downPayment, rate, termYears, startYM, propertyTaxAnnual, insuranceAnnual, extras, autoRecast, recastMonthsText, showAll]);


  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <LoanInputs
            homePrice={homePrice}
            setHomePrice={setHomePrice}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            rate={rate}
            setRate={setRate}
            termYears={termYears}
            setTermYears={setTermYears}
            startYM={startYM}
            setStartYM={setStartYM}
            propertyTaxAnnual={propertyTaxAnnual}
            setPropertyTaxAnnual={setPropertyTaxAnnual}
            insuranceAnnual={insuranceAnnual}
            setInsuranceAnnual={setInsuranceAnnual}
            monthlyPITI={monthlyPITI}
            result={result}
            onReset={clearAllInputs}
          />

          <ExtraPayments
            extras={extras}
            termMonths={Math.round(Number(termYears) * 12)}
            autoRecast={autoRecast}
            setAutoRecast={setAutoRecast}
            recastMonthsText={recastMonthsText}
            setRecastMonthsText={setRecastMonthsText}
            onAddExtra={handleAddExtra}
            onRemoveExtra={handleRemoveExtra}
            onUpdateExtra={handleUpdateExtra}
          />

          <SavedConfigurations
            onLoadConfiguration={handleLoadConfiguration}
            loadedConfigurationId={loadedConfigurationId}
            currentInputs={currentInputs}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={handleSaveChanges}
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