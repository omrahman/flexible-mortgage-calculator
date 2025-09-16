import React from 'react';
import { Th, Td } from './TableComponents';
import { fmtUSD } from '../utils/formatters';
import type { Row } from '../types';
import { SCHEDULE_PREVIEW_ROWS } from '../constants';

interface AmortizationTableProps {
  rows: Row[];
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
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Amortization Schedule</h2>
        <div className="flex gap-2">
          <button 
            className="rounded-xl border px-3 py-2" 
            onClick={onToggleShowAll}
          >
            {showAll ? "Show first 24" : "Show all"}
          </button>
          <button 
            className="rounded-xl bg-black text-white px-3 py-2" 
            onClick={onDownloadCSV}
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <Th>Mo</Th>
              <Th>Date</Th>
              <Th className="text-right">Payment</Th>
              <Th className="text-right">Interest</Th>
              <Th className="text-right">Principal</Th>
              <Th className="text-right">Extra</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Balance</Th>
              <Th>Recast</Th>
              <Th className="text-right">New Pmt</Th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => (
              <tr key={r.idx} className="border-t">
                <Td>{r.idx}</Td>
                <Td>{r.date}</Td>
                <Td className="text-right">{fmtUSD(r.payment)}</Td>
                <Td className="text-right">{fmtUSD(r.interest)}</Td>
                <Td className="text-right">{fmtUSD(r.principal)}</Td>
                <Td className="text-right">{fmtUSD(r.extra)}</Td>
                <Td className="text-right">{fmtUSD(r.total)}</Td>
                <Td className="text-right">{fmtUSD(r.balance)}</Td>
                <Td>
                  {r.recast ? (
                    <span className="text-green-700 font-medium">Yes</span>
                  ) : (
                    ""
                  )}
                </Td>
                <Td className="text-right">
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
