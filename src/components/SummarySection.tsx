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
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  baseline,
  result,
  interestSaved,
  monthsSaved,
  monthlyPITI,
}) => {
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 sm:gap-4">
        <SummaryCard label="Original P&I" value={fmtUSD(baseline.segments[0]?.payment || 0)} />
        <SummaryCard label="Current P&I" value={fmtUSD(result.segments[result.segments.length - 1]?.payment || 0)} />
        <SummaryCard label="Original PITI" value={fmtUSD((baseline.segments[0]?.payment || 0) + monthlyPITI.total)} />
        <SummaryCard label="Current PITI" value={fmtUSD((result.segments[result.segments.length - 1]?.payment || 0) + monthlyPITI.total)} />
        <SummaryCard label="Total Interest (baseline)" value={fmtUSD(baseline.totalInterest)} />
        <SummaryCard label="Total Interest (this plan)" value={fmtUSD(result.totalInterest)} />
        <SummaryCard label="Interest Saved" value={fmtUSD(interestSaved)} highlight={interestSaved > 0} />
        <SummaryCard label="Months Saved" value={`${monthsSaved}`} highlight={monthsSaved > 0} />
        <SummaryCard label="Total Paid" value={fmtUSD(result.totalPaid)} />
        <SummaryCard label="Total Forgiveness" value={fmtUSD(result.totalForgiveness)} highlight={result.totalForgiveness > 0} />
        <SummaryCard label="Net Cost" value={fmtUSD(result.totalPaid - result.totalForgiveness)} />
      </div>

    </div>
  );
};
