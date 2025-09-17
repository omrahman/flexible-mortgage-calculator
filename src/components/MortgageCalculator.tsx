import { useMemo, lazy, Suspense } from 'react';
import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
import { useConfigurations } from '../hooks/useConfigurations';
import { SavedConfiguration } from '../types';
import { LoanInputs } from './LoanInputs';
import { ExtraPayments } from './ExtraPayments';
import { SummarySection } from './SummarySection';
import { PaymentSegments } from './PaymentSegments';
import { SavedConfigurations } from './SavedConfigurations';
import { CSV_FILENAME } from '../constants';

// Lazy load heavy components
const BalanceChart = lazy(() => import('./BalanceChart').then(module => ({ default: module.BalanceChart })));
const AmortizationTable = lazy(() => import('./AmortizationTable').then(module => ({ default: module.AmortizationTable })));

// Lazy load CSV utilities
const loadCSVUtils = () => import('../utils/csv').then(module => ({
  csvFor: module.csvFor,
  downloadCSV: module.downloadCSV
}));

export default function MortgageCalculator() {
  const {
    // State
    homePrice,
    setHomePrice,
    downPayment,
    setDownPayment,
    principal,
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
    termMonths,
    monthlyPITI,
    result,
    baseline,
    interestSaved,
    monthsSaved,
    
    // Debug data
    cachedInputs,
    params,
    
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

  const handleDownloadCSV = async () => {
    const { csvFor, downloadCSV } = await loadCSVUtils();
    downloadCSV(csvFor(result.rows), CSV_FILENAME);
  };

  const handleLoadConfiguration = async (config: SavedConfiguration) => {
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
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-8xl grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
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
            onReset={clearAllInputs}
          />

          {result.rows.length > 0 && (
            <ExtraPayments
              extras={extras}
              termMonths={termMonths}
              startYM={startYM}
              onAddExtra={handleAddExtra}
              onRemoveExtra={handleRemoveExtra}
              onUpdateExtra={handleUpdateExtra}
              autoRecast={autoRecast}
              setAutoRecast={setAutoRecast}
              recastMonthsText={recastMonthsText ?? ''}
              setRecastMonthsText={setRecastMonthsText}
            />
          )}

          <SavedConfigurations
            onLoadConfiguration={handleLoadConfiguration}
            loadedConfigurationId={loadedConfigurationId}
            currentInputs={currentInputs}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={handleSaveChanges}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:space-y-6">
          <SummarySection
            baseline={baseline}
            result={result}
            interestSaved={interestSaved}
            monthsSaved={monthsSaved}
            monthlyPITI={monthlyPITI}
            principal={principal}
            cachedInputs={cachedInputs}
            termMonths={termMonths}
            scheduleParams={params}
          />

          <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
            <BalanceChart chartData={result.chart} />
          </Suspense>

          <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
            <AmortizationTable
              rows={result.rows}
              showAll={showAll}
              onToggleShowAll={() => setShowAll(!showAll)}
              onDownloadCSV={handleDownloadCSV}
            />
          </Suspense>
        </div>

        {/* Payment Segments */}
        <div className="lg:col-span-2 min-w-0">
          <PaymentSegments
            baseline={baseline}
            result={result}
            monthlyPITI={monthlyPITI}
          />
        </div>
      </div>
    </div>
  );
}