import React from 'react';
import { SummaryCard } from './SummaryCard';
import { fmtUSD } from '../utils/formatters';
import { createDebugData, logDebugData } from '../utils/debug';
import type { ScheduleResult, CachedInputs, ScheduleParams } from '../types';

interface SummarySectionProps {
  baseline: ScheduleResult;
  result: ScheduleResult;
  interestSaved: number;
  monthsSaved: number;
  monthlyPITI: { propertyTax: number; insurance: number; total: number };
  principal: number;
  // Debug data
  cachedInputs: CachedInputs;
  termMonths: number;
  scheduleParams: ScheduleParams;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  baseline,
  result,
  interestSaved,
  monthsSaved,
  monthlyPITI,
  principal,
  cachedInputs,
  termMonths,
  scheduleParams,
}) => {
  // Calculate lender's profit using the explicit formula: Total Interest - Total Forgiveness
  const lenderProfit = result.totalInterest - result.totalForgiveness;
  
  // Calculate total extra payments (not forgiveness payments)
  const totalExtraPayments = result.rows.reduce((sum, row) => sum + row.extra, 0);
  
  // Calculate total principal paid
  const totalPrincipalPaid = result.rows.reduce((sum, row) => sum + row.principal + row.extra, 0);
  
  // Calculate Average Annual Return for the lender
  let averageAnnualReturn = 0;
  if (principal > 0 && result.payoffMonth > 0) {
    const yearsToPayoff = result.payoffMonth / 12;
    // Simple average annual return: (Total Interest / Principal) / Years
    averageAnnualReturn = (result.totalInterest / principal) / yearsToPayoff * 100;
  }

  // Debug functionality
  const handleDebugDump = () => {
    const debugData = createDebugData(
      cachedInputs,
      principal,
      termMonths,
      monthlyPITI,
      baseline,
      result,
      interestSaved,
      monthsSaved,
      scheduleParams
    );
    
    logDebugData(debugData);
    
    // Also log the summary card values to console for easy debugging
    console.group('📊 Summary Card Values');
    console.log('Monthly Payments:', {
      'Original P&I': fmtUSD(debugData.calculations.baseline.monthlyPayment),
      'Current P&I': fmtUSD(debugData.calculations.result.monthlyPayment),
      'Original PITI': fmtUSD(debugData.calculations.baseline.monthlyPayment + debugData.inputs.property.monthlyPITI.total),
      'Current PITI': fmtUSD(debugData.calculations.result.monthlyPayment + debugData.inputs.property.monthlyPITI.total),
    });
    console.log('Interest:', {
      'Baseline Total Interest': fmtUSD(debugData.calculations.baseline.totalInterest),
      'Current Total Interest': fmtUSD(debugData.calculations.result.totalInterest),
      'Interest Saved': fmtUSD(debugData.calculations.savings.interestSaved),
    });
    console.log('Payments & Savings:', {
      'Total Paid': fmtUSD(debugData.calculations.result.totalPaid),
      'Total Forgiveness': fmtUSD(debugData.calculations.result.totalForgiveness),
      'Total Extra Payments': fmtUSD(totalExtraPayments),
      'Total Principal Paid': fmtUSD(totalPrincipalPaid),
      'Months Saved': debugData.calculations.savings.monthsSaved,
    });
    console.log('Lender Info:', {
      'Lender Profit': fmtUSD(lenderProfit),
      'Lender Return': `${averageAnnualReturn.toFixed(2)}%`,
    });
    console.groupEnd();
    
    // Copy summary information including all SummaryCard values to clipboard
    const summaryData = {
      timestamp: debugData.timestamp,
      loan: {
        homePrice: fmtUSD(parseFloat(debugData.inputs.loan.homePrice) || 0),
        principal: fmtUSD(debugData.inputs.loan.principal),
        interestRate: `${debugData.inputs.loan.interestRate}%`,
        term: `${debugData.inputs.loan.termYears} years (${debugData.inputs.loan.termMonths} months)`,
        startDate: debugData.inputs.loan.startDate,
      },
      monthlyPayments: {
        originalPandI: fmtUSD(debugData.calculations.baseline.monthlyPayment),
        currentPandI: fmtUSD(debugData.calculations.result.monthlyPayment),
        originalPITI: fmtUSD(debugData.calculations.baseline.monthlyPayment + debugData.inputs.property.monthlyPITI.total),
        currentPITI: fmtUSD(debugData.calculations.result.monthlyPayment + debugData.inputs.property.monthlyPITI.total),
        propertyTax: fmtUSD(debugData.inputs.property.monthlyPITI.propertyTax),
        insurance: fmtUSD(debugData.inputs.property.monthlyPITI.insurance),
      },
      interest: {
        baselineTotalInterest: fmtUSD(debugData.calculations.baseline.totalInterest),
        currentTotalInterest: fmtUSD(debugData.calculations.result.totalInterest),
        interestSaved: fmtUSD(debugData.calculations.savings.interestSaved),
      },
      payments: {
        totalPaid: fmtUSD(debugData.calculations.result.totalPaid),
        totalForgiveness: fmtUSD(debugData.calculations.result.totalForgiveness),
        totalExtraPayments: fmtUSD(totalExtraPayments),
        totalPrincipalPaid: fmtUSD(totalPrincipalPaid),
      },
      savings: {
        monthsSaved: debugData.calculations.savings.monthsSaved,
        payoffMonth: debugData.calculations.result.payoffMonth,
        baselinePayoffMonth: debugData.calculations.baseline.payoffMonth,
      },
      lender: {
        profit: fmtUSD(lenderProfit),
        annualizedReturn: `${averageAnnualReturn.toFixed(2)}%`,
      },
      extraPayments: debugData.inputs.extraPayments.length > 0 ? debugData.inputs.extraPayments : 'None',
    };
    
    const summaryString = JSON.stringify(summaryData, null, 2);
    navigator.clipboard.writeText(summaryString).then(() => {
      console.log('📋 Summary data copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 sm:gap-4">
        {/* Core Loan & Payment Info */}
        <SummaryCard
          label="Loan Amount"
          value={fmtUSD(principal)}
          tooltip="Total amount of the loan, calculated as Home Price - Down Payment."
        />
        <SummaryCard 
          label="Original P&I" 
          value={fmtUSD(baseline.segments[0]?.payment || 0)} 
          tooltip="Original monthly Principal & Interest payment from the baseline loan schedule (no extra payments or forgiveness)."
        />
        <SummaryCard 
          label="Current P&I" 
          value={fmtUSD(result.segments[result.segments.length - 1]?.payment || 0)} 
          tooltip="Current monthly Principal & Interest payment after any recasts due to extra payments or forgiveness."
        />
        <SummaryCard 
          label="Original PITI" 
          value={fmtUSD((baseline.segments[0]?.payment || 0) + monthlyPITI.total)} 
          tooltip="Original P&I + monthly Property Tax + monthly Insurance = total monthly housing payment."
        />
        <SummaryCard 
          label="Current PITI" 
          value={fmtUSD((result.segments[result.segments.length - 1]?.payment || 0) + monthlyPITI.total)} 
          tooltip="Current P&I + monthly Property Tax + monthly Insurance = total monthly housing payment after recasts."
        />

        {/* Savings */}
        <SummaryCard 
          label="Total Interest (baseline)" 
          value={fmtUSD(baseline.totalInterest)} 
          tooltip="Total interest paid over the life of the baseline loan (no extra payments or forgiveness)."
        />
        <SummaryCard 
          label="Total Interest (this plan)" 
          value={fmtUSD(result.totalInterest)} 
          tooltip="Total interest paid over the life of the loan with extra payments and/or forgiveness applied."
        />
        <SummaryCard 
          label="Interest Saved" 
          value={fmtUSD(interestSaved)} 
          highlight={interestSaved > 0} 
          tooltip="Interest saved = Baseline Total Interest - Current Plan Total Interest. Shows how much interest you save with extra payments or forgiveness."
        />
        <SummaryCard 
          label="Months Saved" 
          value={`${monthsSaved}`} 
          highlight={monthsSaved > 0} 
          tooltip="Number of months earlier the loan is paid off compared to the baseline schedule. Calculated as Baseline Payoff Month - Current Plan Payoff Month."
        />

        {/* Payment Totals */}
        <SummaryCard 
          label="Total Paid" 
          value={fmtUSD(result.totalPaid)} 
          tooltip="Total cash payments made by the borrower = all scheduled P&I payments + all extra principal payments. Does not include forgiveness amounts."
        />
        <SummaryCard 
          label="Total Principal Paid" 
          value={fmtUSD(totalPrincipalPaid)} 
          tooltip="Total amount of principal paid over the life of the loan, including both scheduled principal payments and extra principal payments."
        />
        <SummaryCard 
          label="Total Extra Payments" 
          value={fmtUSD(totalExtraPayments)} 
          highlight={totalExtraPayments > 0} 
          tooltip="Total amount of extra principal payments made beyond the scheduled monthly payments. This does not include forgiveness amounts."
        />
        <SummaryCard 
          label="Total Forgiveness" 
          value={fmtUSD(result.totalForgiveness)} 
          highlight={result.totalForgiveness > 0} 
          tooltip="Total amount of loan forgiveness received. This reduces the loan balance without requiring cash payment from the borrower."
        />

        {/* Lender Metrics */}
        <SummaryCard 
          label="Lender's Profit" 
          value={fmtUSD(lenderProfit)} 
          tooltip="Lender's net profit = Total Interest Paid - Total Forgiveness. This represents the lender's total earnings after accounting for any forgiven principal, which is a direct loss."
        />
        <SummaryCard 
          label="Lender's Return (Avg. Annual)" 
          value={`${averageAnnualReturn.toFixed(2)}%`} 
          tooltip="Average annual return on the lender's investment, calculated as (Total Interest / Principal) / (Years to Payoff). This is a simplified measure of the lender's profitability on an annualized basis."
        />
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={handleDebugDump}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Log full debug data to console and copy summary to clipboard"
        >
          🐛 Debug
        </button>
      </div>
    </div>
  );
};
