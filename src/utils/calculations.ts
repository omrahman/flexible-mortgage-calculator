// Core mortgage calculation functions

import { round2 } from './formatters';
import { MAX_ITERATIONS, MIN_BALANCE_THRESHOLD, PAYMENT_DIFFERENCE_THRESHOLD } from '../constants';
import type { Row, ScheduleResult, ScheduleParams } from '../types';

export const calcPayment = (principal: number, rMonthly: number, nMonths: number): number => {
  if (nMonths <= 0) return 0;
  if (Math.abs(rMonthly) < 1e-12) return round2(principal / nMonths);
  const pmt = (principal * rMonthly) / (1 - Math.pow(1 + rMonthly, -nMonths));
  return round2(pmt);
};

export const addMonths = (ymStr: string, plus: number): string => {
  // ymStr: "YYYY-MM"
  const [Y, M] = ymStr.split("-").map((x) => parseInt(x, 10));
  const d = new Date(Date.UTC(Y, (M - 1) + plus, 1));
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
};

export const parseMonthInput = (txt: string): number[] => {
  // Accept comma-separated numbers and ranges like 12-18
  if (!txt.trim()) return [];
  const parts = txt
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const months: number[] = [];
  for (const p of parts) {
    if (/^\d+-\d+$/.test(p)) {
      const [a, b] = p.split("-").map((x) => parseInt(x, 10));
      if (a > 0 && b >= a) {
        for (let i = a; i <= b; i++) months.push(i);
      }
    } else if (/^\d+$/.test(p)) {
      const v = parseInt(p, 10);
      if (v > 0) months.push(v);
    }
  }
  return Array.from(new Set(months)).sort((a, b) => a - b);
};

// Convert month number (1-based) to Year/Month string based on loan start date
export const monthNumberToYearMonth = (monthNumber: number, startYM: string): string => {
  return addMonths(startYM, monthNumber - 1);
};

// Convert Year/Month string to month number (1-based) based on loan start date
export const yearMonthToMonthNumber = (yearMonth: string, startYM: string): number => {
  const startDate = new Date(startYM + '-01');
  const targetDate = new Date(yearMonth + '-01');
  
  const yearDiff = targetDate.getFullYear() - startDate.getFullYear();
  const monthDiff = targetDate.getMonth() - startDate.getMonth();
  
  return yearDiff * 12 + monthDiff + 1;
};

export const buildSchedule = ({
  principal,
  annualRatePct,
  termMonths,
  startYM,
  extras,
  forgiveness,
  recastMonths,
  autoRecastOnExtra,
}: ScheduleParams): ScheduleResult => {
  const r = annualRatePct / 100 / 12;
  let bal = round2(principal);
  let payment = calcPayment(bal, r, termMonths);
  const rows: Row[] = [];
  const segments: { start: number; payment: number }[] = [{ start: 1, payment }];
  let totalInterest = 0;
  let totalPaid = 0;
  let totalForgiveness = 0;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let cumulativeForgiveness = 0;

  // Safety: guard against pathological loops.
  const maxIters = termMonths + MAX_ITERATIONS; // allows for recasts/rounding edge cases

  for (let m = 1; m <= maxIters && bal > MIN_BALANCE_THRESHOLD; m++) {
    const monthsRemaining = Math.max(0, termMonths - (m - 1));
    const date = addMonths(startYM, m - 1);
    const interest = round2(bal * r);

    let scheduled = payment;
    // For the final month of the original term, adjust the payment to exactly pay off the loan
    if (m === termMonths) {
      scheduled = bal + interest;
    }

    // Scheduled payment cannot exceed payoff amount (bal + interest)
    scheduled = Math.min(scheduled, round2(bal + interest));
    let principalPart = round2(scheduled - interest);
    if (principalPart < 0) principalPart = 0; // paranoia guard

    const plannedExtra = round2(extras[m] || 0);
    const principalPartAfterScheduled = bal - principalPart;
    const maxExtra = round2(principalPartAfterScheduled);
    const extra = Math.max(0, Math.min(plannedExtra, maxExtra));
    
    const plannedForgiveness = round2(forgiveness[m] || 0);
    const maxForgiveness = round2(bal); // Maximum forgiveness is the entire remaining balance
    const forgivenessAmount = Math.max(0, Math.min(plannedForgiveness, maxForgiveness));
    
    const cashThisMonth = round2(scheduled + extra);

    totalInterest = round2(totalInterest + interest);
    totalPaid = round2(totalPaid + cashThisMonth);
    totalForgiveness = round2(totalForgiveness + forgivenessAmount);
    cumulativeInterest = round2(cumulativeInterest + interest);
    cumulativePrincipal = round2(cumulativePrincipal + principalPart + extra);
    cumulativeForgiveness = round2(cumulativeForgiveness + forgivenessAmount);

    // Calculate new balance, ensuring it doesn't go negative
    // Forgiveness reduces balance but doesn't count as principal paid
    const newBalance = round2(bal - principalPart - extra - forgivenessAmount);
    bal = Math.max(0, newBalance);

    let didRecast = false;
    let newPayment: number | undefined;

    const shouldRecast =
      (recastMonths.has(m) || (autoRecastOnExtra && (extra > 0 || forgivenessAmount > 0))) && monthsRemaining > 0 && bal > 0;

    if (shouldRecast) {
      didRecast = true;
      // Use the actual remaining months from the original term
      // This ensures we maintain the original maturity date
      const remaining = monthsRemaining;
      newPayment = calcPayment(bal, r, remaining);
      if (Math.abs(newPayment - payment) > PAYMENT_DIFFERENCE_THRESHOLD) {
        payment = newPayment;
        segments.push({ start: m + 1, payment });
      }
    }

    rows.push({
      idx: m,
      date,
      payment: scheduled,
      interest,
      principal: principalPart,
      extra,
      forgiveness: forgivenessAmount,
      total: cashThisMonth,
      balance: bal,
      cumulativeInterest,
      cumulativePrincipal,
      cumulativeForgiveness,
      recast: didRecast || undefined,
      newPayment,
    });

    // If we've reached the contractual maturity but a balance remains due to rounding,
    // we need to handle it gracefully.
    if (m === termMonths && bal > MIN_BALANCE_THRESHOLD && bal < 1.0) {
      // This block is now largely redundant but can be kept as a safeguard for extreme rounding cases
      const lastRow = rows[m - 1];
      if (lastRow) {
        lastRow.balance = 0;
        bal = 0;
      }
    }
  }

  const chart = rows.map((r) => ({ 
    name: `${r.idx}\n${r.date}`, 
    balance: r.balance,
    cumulativeInterest: r.cumulativeInterest,
    cumulativePrincipal: r.cumulativePrincipal,
    cumulativeForgiveness: r.cumulativeForgiveness
  }));

  return {
    rows,
    totalInterest,
    totalPaid,
    totalForgiveness,
    payoffMonth: rows[rows.length - 1]?.idx ?? 0,
    segments,
    chart,
  };
};
