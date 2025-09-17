// Core mortgage calculation functions

import { round2 } from './formatters';
import { MAX_ITERATIONS, MIN_BALANCE_THRESHOLD, PAYMENT_DIFFERENCE_THRESHOLD } from '../constants';
import type { BalanceChartRow, ScheduleResult, ScheduleParams } from '../types';

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
  extraPayments,
  forgiveness,
  recastMonths,
  autoRecastOnExtra,
}: ScheduleParams): ScheduleResult => {
  const rate = annualRatePct / 100 / 12;
  let balance = round2(principal);
  let payment = calcPayment(balance, rate, termMonths);
  const rows: BalanceChartRow[] = [];
  const paymentSegments: { start: number; payment: number }[] = [{ start: 1, payment }];
  let totalInterest = 0;
  let totalPaid = 0;
  let totalForgiveness = 0;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let cumulativeForgiveness = 0;

  // Safety: guard against pathological loops.
  const maxIters = termMonths + MAX_ITERATIONS; // allows for recasts/rounding edge cases

  for (let monthNumber = 1; monthNumber <= maxIters && balance > MIN_BALANCE_THRESHOLD; monthNumber++) {
    const monthsRemaining = Math.max(0, termMonths - (monthNumber - 1));
    const date = addMonths(startYM, monthNumber - 1);
    const interest = round2(balance * rate);

    let scheduledPayment = payment;
    // For the final month of the original term, adjust the payment to exactly pay off the loan
    if (monthNumber === termMonths) {
      scheduledPayment = balance + interest;
    }

    // Scheduled payment cannot exceed payoff amount (bal + interest)
    scheduledPayment = Math.min(scheduledPayment, round2(balance + interest));
    let principalPart = round2(scheduledPayment - interest);
    if (principalPart < 0) {
      console.warn(`Principal part is negative: ${principalPart}. Setting to 0.`);
      principalPart = 0; // paranoia guard
    }

    const plannedExtraPayment = round2(extraPayments[monthNumber] || 0);
    const principalPartAfterScheduled = balance - principalPart;
    const maxExtraPayment = round2(principalPartAfterScheduled);
    const actualExtraPayment = Math.max(0, Math.min(plannedExtraPayment, maxExtraPayment));
    
    const plannedForgiveness = round2(forgiveness[monthNumber] || 0);
    const maxForgiveness = round2(balance); // Maximum forgiveness is the entire remaining balance
    const actualForgiveness = Math.max(0, Math.min(plannedForgiveness, maxForgiveness));
    
    const cashThisMonth = round2(scheduledPayment + actualExtraPayment);

    totalInterest = round2(totalInterest + interest);
    totalPaid = round2(totalPaid + cashThisMonth);
    totalForgiveness = round2(totalForgiveness + actualForgiveness);
    cumulativeInterest = round2(cumulativeInterest + interest);
    cumulativePrincipal = round2(cumulativePrincipal + principalPart + actualExtraPayment);
    cumulativeForgiveness = round2(cumulativeForgiveness + actualForgiveness);

    // Calculate new balance, ensuring it doesn't go negative
    // Forgiveness reduces balance but doesn't count as principal paid
    const newBalance = round2(balance - principalPart - actualExtraPayment - actualForgiveness);
    balance = Math.max(0, newBalance);

    let didRecast = false;
    let newPayment: number | undefined;

    const shouldRecast =
      (recastMonths.has(monthNumber) || (autoRecastOnExtra && (actualExtraPayment > 0 || actualForgiveness > 0))) && monthsRemaining > 0 && balance > 0;

    if (shouldRecast) {
      didRecast = true;
      // Use the actual remaining months from the original term
      // This ensures we maintain the original maturity date
      const remaining = monthsRemaining;
      newPayment = calcPayment(balance, rate, remaining);
      if (Math.abs(newPayment - payment) > PAYMENT_DIFFERENCE_THRESHOLD) {
        payment = newPayment;
        paymentSegments.push({ start: monthNumber + 1, payment });
      }
    }

    rows.push({
      idx: monthNumber,
      paymentDate: date,
      scheduledPayment: scheduledPayment,
      interest,
      scheduledPrincipal: principalPart,
      extraPrincipal: actualExtraPayment,
      forgivenPrincipal: actualForgiveness,
      actualPayment: cashThisMonth,
      loanBalance: balance,
      cumulativeInterest,
      cumulativePrincipal,
      cumulativeForgiveness,
      recast: didRecast || undefined,
      newPayment,
    });

    // If we've reached the contractual maturity but a balance remains due to rounding,
    // we need to handle it gracefully.
    if (monthNumber === termMonths && balance > MIN_BALANCE_THRESHOLD && balance < 1.0) {
      // This block is now largely redundant but can be kept as a safeguard for extreme rounding cases
      const lastRow = rows[monthNumber - 1];
      if (lastRow) {
        lastRow.loanBalance = 0;
        balance = 0;
      }
    }
  }

  const chart = rows.map((r) => ({ 
    name: `${r.idx}\n${r.paymentDate}`, 
    balance: r.loanBalance,
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
    segments: paymentSegments,
    chart,
  };
};
