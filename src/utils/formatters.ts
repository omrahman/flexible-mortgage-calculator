// Utility functions for formatting data

export const round2 = (v: number): number => {
  return Math.round((v + Number.EPSILON) * 100) / 100;
};

export const fmtUSD = (v: number): string => {
  if (!Number.isFinite(v)) return '$0.00';
  const isNegative = v < 0;
  const absValue = Math.abs(v);
  const formatted =
    '$' +
    absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return isNegative ? `(${formatted})` : formatted;
};
