import React from 'react';
import { SummaryCard } from './SummaryCard';
import { fmtUSD } from '../utils/formatters';
import type { ScheduleResult } from '../types';

interface SummarySectionProps {
  baseline: ScheduleResult;
  result: ScheduleResult;
  interestSaved: number;
  monthsSaved: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  baseline,
  result,
  interestSaved,
  monthsSaved,
}) => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Summary</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Original Payment" value={fmtUSD(baseline.segments[0]?.payment || 0)} />
        <SummaryCard label="Current Payment" value={fmtUSD(result.segments[result.segments.length - 1]?.payment || 0)} />
        <SummaryCard label="Total Interest (baseline)" value={fmtUSD(baseline.totalInterest)} />
        <SummaryCard label="Total Interest (this plan)" value={fmtUSD(result.totalInterest)} />
        <SummaryCard label="Interest Saved" value={fmtUSD(interestSaved)} highlight={interestSaved > 0} />
        <SummaryCard label="Payoff (baseline)" value={`${baseline.payoffMonth} mo`} />
        <SummaryCard label="Payoff (this plan)" value={`${result.payoffMonth} mo`} />
        <SummaryCard label="Months Saved" value={`${monthsSaved}`} highlight={monthsSaved > 0} />
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Payment segments</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {result.segments.map((s, i) => (
            <span key={i} className="rounded-full border px-3 py-1">
              from m{s.start}: {fmtUSD(s.payment)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
