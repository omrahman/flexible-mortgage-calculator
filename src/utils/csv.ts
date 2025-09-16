// CSV export utilities

import type { Row } from '../types';

export const csvFor = (rows: Row[]): string => {
  const header = [
    "Month",
    "Date",
    "Scheduled Payment",
    "Interest",
    "Principal",
    "Extra",
    "Total Paid",
    "Ending Balance",
    "Recast?",
    "New Payment",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.idx,
        r.date,
        r.payment.toFixed(2),
        r.interest.toFixed(2),
        r.principal.toFixed(2),
        r.extra.toFixed(2),
        r.total.toFixed(2),
        r.balance.toFixed(2),
        r.recast ? "YES" : "",
        r.newPayment ? r.newPayment.toFixed(2) : "",
      ].join(",")
    );
  }
  return lines.join("\n");
};

export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
