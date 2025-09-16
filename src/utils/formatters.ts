// Utility functions for formatting data

export const fmtUSD = (n: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(n) ? n : 0
  );

export const round2 = (n: number): number => Math.round(n * 100) / 100;
