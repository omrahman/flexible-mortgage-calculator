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
  const lenderProfit = result.totalPaid - principal;
  
  // Calculate annualized return for the lender
  // Extra payments don't change the return rate, they just reduce the outstanding balance
  // Forgiveness DOES change the return rate because the lender loses principal that is never recovered
  let annualizedReturn = 0;
  
  if (principal > 0) {
    const hasForgiveness = result.totalForgiveness > 0;
    
    if (!hasForgiveness) {
      // No forgiveness - return equals the interest rate
      // Extra payments don't change the return rate, they just reduce the outstanding balance
      annualizedReturn = interestRate;
    } else {
      // With forgiveness - the return rate is reduced proportionally
      // The lender earns the interest rate on the effective principal (principal - forgiveness)
      // Return = Interest Rate * (1 - Forgiveness/Principal)
      const forgivenessRatio = result.totalForgiveness / principal;
      annualizedReturn = interestRate * (1 - forgivenessRatio);
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
          label="Lender's Profit" 
          value={fmtUSD(lenderProfit)} 
          tooltip="Lender's profit = Total Paid - Principal. This is the total amount the lender earns above the original loan amount."
        />
        <SummaryCard 
          label="Lender's Return (Annualized)" 
          value={`${annualizedReturn.toFixed(2)}%`} 
          tooltip="Annualized return rate for the lender. For standard loans and loans with extra payments, this equals the interest rate. For loans with forgiveness, this is the interest rate reduced proportionally by the forgiveness amount: Interest Rate × (1 - Forgiveness/Principal). This reflects that the lender earns interest on the effective principal (principal minus forgiveness)."
        />
      </div>

    </div>
  );
};
