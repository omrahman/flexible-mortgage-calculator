import React from 'react';
import { SummaryCard } from './SummaryCard';
import { fmtUSD } from '../utils/formatters';
import type { ScheduleResult } from '../types';

interface SummarySectionProps {
  baseline: ScheduleResult;
  result: ScheduleResult;
  interestSaved: number;
  monthsSaved: number;
  monthlyPITI: { propertyTax: number; insurance: number; total: number };
  principal: number;
  interestRate: number; // Annual interest rate as a percentage
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  baseline,
  result,
  interestSaved,
  monthsSaved,
  monthlyPITI,
  principal,
  interestRate,
}) => {
  // Calculate lender's profit and annualized return percentage
  // Lender's profit = Total Paid - Principal
  // This represents the total amount the lender earns above the original loan amount
  const lenderProfit = result.totalPaid - principal;
  
  // Calculate total extra payments (not forgiveness payments)
  const totalExtraPayments = result.rows.reduce((sum, row) => sum + row.extra, 0);
  
  // Calculate total principal paid
  const totalPrincipalPaid = result.rows.reduce((sum, row) => sum + row.principal, 0);
  
  // Calculate annualized return for the lender
  // For standard loans, return equals the interest rate
  // For modified loans, return is adjusted based on actual vs expected interest
  let annualizedReturn = 0;
  
  if (principal > 0) {
    // Calculate expected interest for a standard loan at this rate and term
    const monthlyRate = interestRate / 100 / 12;
    const termMonths = baseline.payoffMonth;
    const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const expectedInterest = (monthlyPayment * termMonths) - principal;
    
    if (expectedInterest > 0) {
      // Return = Interest Rate * (Actual Interest / Expected Interest)
      // This adjusts the return based on actual performance
      annualizedReturn = interestRate * (result.totalInterest / expectedInterest);
    } else {
      // Fallback to interest rate if expected interest calculation fails
      annualizedReturn = interestRate;
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 sm:gap-4">
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
        <SummaryCard 
          label="Total Paid" 
          value={fmtUSD(result.totalPaid)} 
          tooltip="Total cash payments made by the borrower = all scheduled P&I payments + all extra principal payments. Does not include forgiveness amounts."
        />
        <SummaryCard 
          label="Total Forgiveness" 
          value={fmtUSD(result.totalForgiveness)} 
          highlight={result.totalForgiveness > 0} 
          tooltip="Total amount of loan forgiveness received. This reduces the loan balance without requiring cash payment from the borrower."
        />
        <SummaryCard 
          label="Total Extra Payments" 
          value={fmtUSD(totalExtraPayments)} 
          highlight={totalExtraPayments > 0} 
          tooltip="Total amount of extra principal payments made beyond the scheduled monthly payments. This does not include forgiveness amounts."
        />
        <SummaryCard 
          label="Total Principal Paid" 
          value={fmtUSD(totalPrincipalPaid)} 
          tooltip="Total amount of principal paid over the life of the loan, including both scheduled principal payments and extra principal payments."
        />
        <SummaryCard 
          label="Lender's Profit" 
          value={fmtUSD(lenderProfit)} 
          tooltip="Lender's cash profit = Total Paid - Principal. This is the total amount the lender earns in cash payments above the original loan amount. Does not account for forgiveness amounts that reduce the total amount owed."
        />
        <SummaryCard 
          label="Lender's Return (Annualized)" 
          value={`${annualizedReturn.toFixed(2)}%`} 
          tooltip="Annualized return rate for the lender. For standard loans, this equals the interest rate. For modified loans (with extra payments or forgiveness), this is the interest rate adjusted by the ratio of actual interest earned to expected interest: Interest Rate × (Actual Interest / Expected Interest). This reflects the lender's actual return based on the loan's performance."
        />
      </div>

    </div>
  );
};
