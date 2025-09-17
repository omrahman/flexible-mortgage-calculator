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

    // Scheduled payment cannot exceed payoff amount (bal + interest)
    const scheduled = Math.min(payment, round2(bal + interest));
    let principalPart = round2(scheduled - interest);
    if (principalPart < 0) principalPart = 0; // paranoia guard

    const plannedExtra = round2(extras[m] || 0);
    const maxExtra = round2(bal + interest); // Maximum extra payment is the entire remaining balance + interest
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

    // If we've reached the contractual maturity but tiny balance remains due to rounding,
    // just zero out the balance to avoid adding extra months for small rounding errors
    if (m === termMonths && bal > MIN_BALANCE_THRESHOLD) {
      // For very small balances at maturity, just zero them out
      if (bal < 1.0) {
        bal = 0;
        break;
      } else {
        // For larger balances, add a payoff month
        const payoffInterest = round2(bal * r);
        const payoffTotal = round2(bal + payoffInterest);
        const payoffPrincipal = round2(payoffTotal - payoffInterest);
        totalInterest = round2(totalInterest + payoffInterest);
        totalPaid = round2(totalPaid + payoffTotal);
        cumulativeInterest = round2(cumulativeInterest + payoffInterest);
        cumulativePrincipal = round2(cumulativePrincipal + payoffPrincipal);
        bal = 0;
        rows.push({
          idx: m + 1,
          date: addMonths(startYM, m),
          payment: payoffTotal,
          interest: payoffInterest,
          principal: payoffPrincipal,
          extra: 0,
          forgiveness: 0,
          total: payoffTotal,
          balance: 0,
          cumulativeInterest,
          cumulativePrincipal,
          cumulativeForgiveness,
        });
        break;
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
