import React from 'react';
import { Th, Td } from './TableComponents';
import { fmtUSD } from '../utils/formatters';
import type { BalanceChartRow } from '../types';
import { SCHEDULE_PREVIEW_ROWS } from '../constants';

interface AmortizationTableProps {
  rows: BalanceChartRow[];
  showAll: boolean;
  onToggleShowAll: () => void;
  onDownloadCSV: () => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  rows,
  showAll,
  onToggleShowAll,
  onDownloadCSV,
}) => {
  const displayRows = showAll ? rows : rows.slice(0, SCHEDULE_PREVIEW_ROWS);

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <button 
          className="rounded-xl border px-3 py-2 text-sm" 
          onClick={onToggleShowAll}
        >
          {showAll ? "Show Preview" : "Show All"}
        </button>
        <button 
          className="rounded-xl bg-black text-white px-3 py-2 text-sm" 
          onClick={onDownloadCSV}
        >
          Download CSV
        </button>
      </div>

      <div className="overflow-auto rounded-xl border table-container">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <Th>Mo</Th>
              <Th>Date</Th>
              <Th className="text-right">Payment</Th>
              <Th className="text-right">Interest</Th>
              <Th className="text-right">Principal</Th>
              <Th className="text-right">Extra</Th>
              <Th className="text-right">Forgiveness</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Balance</Th>
              <Th className="text-right">Cum. Interest</Th>
              <Th className="text-right">Cum. Principal</Th>
              <Th className="text-right">Cum. Forgiveness</Th>
              <Th>Recast</Th>
              <Th className="text-right">New Pmt</Th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => (
              <tr key={r.idx} className="border-t">
                <Td className="whitespace-nowrap">{r.idx}</Td>
                <Td className="whitespace-nowrap">{r.paymentDate}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.scheduledPayment)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.interest)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.scheduledPrincipal)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.extraPrincipal)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.forgivenPrincipal)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.actualPayment)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.loanBalance)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.cumulativeInterest)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.cumulativePrincipal)}</Td>
                <Td className="text-right whitespace-nowrap">{fmtUSD(r.cumulativeForgiveness)}</Td>
                <Td className="text-center">
                  {r.recast ? (
                    <span className="text-green-700 font-medium">Yes</span>
                  ) : (
                    ""
                  )}
                </Td>
                <Td className="text-right whitespace-nowrap">
                  {r.newPayment ? fmtUSD(r.newPayment) : ""}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Notes: This sim assumes monthly compounding, level-payment mortgage. Recast keeps the original maturity date, recalculating P&I on the remaining balance. Lenders may charge a fee and have rules; this is a planning tool, not advice.
      </p>
    </div>
  );
};
