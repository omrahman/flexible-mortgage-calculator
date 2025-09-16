import { useMortgageCalculation } from '../hooks/useMortgageCalculation';
import { LoanInputs } from './LoanInputs';
import { ExtraPayments } from './ExtraPayments';
import { SummarySection } from './SummarySection';
import { BalanceChart } from './BalanceChart';
import { AmortizationTable } from './AmortizationTable';
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
  } = useMortgageCalculation();

  const handleDownloadCSV = () => {
    downloadCSV(csvFor(result.rows), CSV_FILENAME);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
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