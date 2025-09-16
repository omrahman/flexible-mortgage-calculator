import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
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
    
    // State
    loadedConfigurationId,
  } = useMortgageCalculation();


  const handleDownloadCSV = () => {
    downloadCSV(csvFor(result.rows), CSV_FILENAME);
  };

  const handleLoadConfiguration = async (config: any) => {
    try {
      await loadConfiguration(config, config.id);
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error; // Re-throw to let the UI handle it
    }
  };


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