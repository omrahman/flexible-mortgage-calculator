import { useMemo, lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
import { useConfigurations } from '../hooks/useConfigurations';
import { SavedConfiguration, LoanSummary } from '../types';
import { LoanInputs } from './LoanInputs';
import { ExtraPayments } from './ExtraPayments';
import { SummarySection } from './SummarySection';
import { PaymentSegments } from './PaymentSegments';
import { SavedConfigurations } from './SavedConfigurations';
import { CSV_FILENAME } from '../constants';
import { Tabs } from './Tabs';
import { Section } from './Section';
import { importFromUrl, deserializeLoanConfiguration } from '../utils/serialization';

// Lazy load heavy components
const BalanceChart = lazy(() => import('./BalanceChart').then(module => ({ default: module.BalanceChart })));
const AmortizationTable = lazy(() => import('./AmortizationTable').then(module => ({ default: module.AmortizationTable })));

// Lazy load CSV utilities
const loadCSVUtils = () => import('../utils/csv').then(module => ({
  csvFor: module.csvFor,
  downloadCSV: module.downloadCSV
}));

export default function MortgageCalculator() {
  const { encodedConfig } = useParams<{ encodedConfig?: string }>();
  const navigate = useNavigate();
  const [processedConfig, setProcessedConfig] = useState<string | undefined>();
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
    clearLoadedConfiguration,
    markChangesAsSaved,
    
    // State
    loadedConfigurationId,
    hasUnsavedChanges,
  } = useMortgageCalculation();

  const { updateConfiguration, getConfiguration } = useConfigurations();

  const loanSummary: LoanSummary | undefined = useMemo(() => {
    if (!result.payoffMonth || !startYM) return undefined;

    const [year, month] = startYM.split('-').map(Number);
    const payoffDateObj = new Date(year, month - 1);
    payoffDateObj.setMonth(payoffDateObj.getMonth() + result.payoffMonth - 1);
    const payoffDate = `${payoffDateObj.getFullYear()}-${String(payoffDateObj.getMonth() + 1).padStart(2, '0')}`;

    const totalExtraPayments = result.rows.reduce((sum, row) => sum + row.extraPrincipal, 0);
    const totalPrincipalPaid = result.rows.reduce((sum, row) => sum + row.scheduledPrincipal + row.extraPrincipal, 0);
    const lenderProfit = result.totalInterest - result.totalForgiveness;
    const lenderROI = principal > 0 ? (lenderProfit / principal) * 100 : 0;

    return {
      // Core Loan & Payment Info
      loanAmount: principal,
      originalPI: baseline.segments[0]?.payment || 0,
      currentPI: result.segments[result.segments.length - 1]?.payment || 0,
      originalPITI: (baseline.segments[0]?.payment || 0) + monthlyPITI.total,
      currentPITI: (result.segments[result.segments.length - 1]?.payment || 0) + monthlyPITI.total,

      // Savings
      totalInterestBaseline: baseline.totalInterest,
      totalInterestCurrent: result.totalInterest,
      interestSaved,
      monthsSaved,
      payoffDate,

      // Payment Totals
      totalPaid: result.totalPaid,
      totalPrincipalPaid,
      totalExtraPayments,
      totalForgiveness: result.totalForgiveness,

      // Lender Metrics
      lenderProfit,
      lenderROI,
    };
  }, [result, baseline, principal, monthlyPITI, interestSaved, monthsSaved, startYM]);


  useEffect(() => {
    if (encodedConfig && encodedConfig !== processedConfig) {
      setProcessedConfig(encodedConfig);
      const result = importFromUrl(encodedConfig);
      if (result.isValid && result.data) {
        const cachedInputs = deserializeLoanConfiguration(result.data);
        loadConfiguration(cachedInputs, `shared-${Date.now()}`);
        navigate('/', { replace: true });
      } else {
        console.error('Failed to import configuration from URL:', result.errors);
        // Optionally, show an error message to the user
        navigate('/', { replace: true });
      }
    }
  }, [encodedConfig, processedConfig, loadConfiguration, navigate]);

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

  const tabs = [
    {
      label: 'Inputs',
      content: (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <Section title="Loan Inputs">
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
              loanAmount={principal}
              onReset={clearAllInputs}
            />
          </Section>

          {result.rows.length > 0 && (
            <Section title="Extra Payments">
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
            </Section>
          )}
        </div>
      ),
    },
    {
      label: 'Summary',
      content: (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <Section title="Summary">
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
          </Section>
          <Section title="Payment Segments">
            <PaymentSegments
              baseline={baseline}
              result={result}
              monthlyPITI={monthlyPITI}
            />
          </Section>
        </div>
      ),
    },
    {
      label: 'Charts & Tables',
      content: (
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          <Section title="Balance Chart">
            <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
              <BalanceChart chartData={result.chart} />
            </Suspense>
          </Section>

          <Section title="Amortization Table">
            <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
              <AmortizationTable
                rows={result.rows}
                showAll={showAll}
                onToggleShowAll={() => setShowAll(!showAll)}
                onDownloadCSV={handleDownloadCSV}
              />
            </Suspense>
          </Section>
        </div>
      ),
    },
    {
      label: 'Scenarios',
      content: (
        <Section title="Saved Scenarios">
          <SavedConfigurations
            onLoadConfiguration={handleLoadConfiguration}
            onClearLoadedConfiguration={clearLoadedConfiguration}
            loadedConfigurationId={loadedConfigurationId}
            currentInputs={currentInputs}
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={handleSaveChanges}
            loanSummary={loanSummary}
          />
        </Section>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-8xl">
        {/* Mobile View */}
        <div className="lg:hidden">
          <Tabs tabs={tabs} />
        </div>
        
        {/* Desktop View */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
            <Section title="Loan Inputs">
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
                loanAmount={principal}
                onReset={clearAllInputs}
              />
            </Section>

            {result.rows.length > 0 && (
              <Section title="Extra Payments">
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
              </Section>
            )}

            <Section title="Saved Scenarios">
              <SavedConfigurations
                onLoadConfiguration={handleLoadConfiguration}
                onClearLoadedConfiguration={clearLoadedConfiguration}
                loadedConfigurationId={loadedConfigurationId}
                currentInputs={currentInputs}
                hasUnsavedChanges={hasUnsavedChanges}
                onSaveChanges={handleSaveChanges}
                loanSummary={loanSummary}
              />
            </Section>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4 lg:space-y-6">
            <Section title="Summary">
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
            </Section>

            <Section title="Balance Chart">
              <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
                <BalanceChart chartData={result.chart} />
              </Suspense>
            </Section>

            <Section title="Amortization Table">
              <Suspense fallback={<div className="rounded-2xl bg-white p-5 shadow animate-pulse"><div className="h-64 bg-gray-200 rounded"></div></div>}>
                <AmortizationTable
                  rows={result.rows}
                  showAll={showAll}
                  onToggleShowAll={() => setShowAll(!showAll)}
                  onDownloadCSV={handleDownloadCSV}
                />
              </Suspense>
            </Section>
          </div>

          {/* Payment Segments */}
          <div className="lg:col-span-2 min-w-0">
            <Section title="Payment Segments">
              <PaymentSegments
                baseline={baseline}
                result={result}
                monthlyPITI={monthlyPITI}
              />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}