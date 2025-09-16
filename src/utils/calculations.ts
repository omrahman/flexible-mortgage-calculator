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

export const buildSchedule = ({
  principal,
  annualRatePct,
  termMonths,
  startYM,
  extras,
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
    const maxExtra = round2(bal); // Maximum extra payment is the entire remaining balance
    const extra = Math.max(0, Math.min(plannedExtra, maxExtra));
    
    // Debug: Log extra payments for first few months
    if (m <= 5 && plannedExtra > 0) {
      console.log(`Month ${m}: Extra payment = $${extra} (planned: $${plannedExtra})`);
    }

    const cashThisMonth = round2(scheduled + extra);

    totalInterest = round2(totalInterest + interest);
    totalPaid = round2(totalPaid + cashThisMonth);

    // Debug: Log balance calculation for first few months
    if (m <= 5) {
      console.log(`Month ${m}: Balance before = $${bal}, Principal = $${principalPart}, Extra = $${extra}, Balance after = $${round2(bal - principalPart - extra)}`);
    }

    bal = round2(bal - principalPart - extra);

    let didRecast = false;
    let newPayment: number | undefined;

    const shouldRecast =
      (recastMonths.has(m) || (autoRecastOnExtra && extra > 0)) && monthsRemaining > 0 && bal > 0;

    if (shouldRecast) {
      didRecast = true;
      const remaining = monthsRemaining; // keep the original maturity date
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
      total: cashThisMonth,
      balance: bal,
      recast: didRecast || undefined,
      newPayment,
    });

    // If we've reached the contractual maturity but tiny balance remains due to rounding,
    // tack on one last payoff row. Only do this if the balance is significant enough
    // to warrant an additional payment (not just rounding errors from extra payments).
    if (m === termMonths && bal > MIN_BALANCE_THRESHOLD) {
      // Check if this is likely a rounding error from extra payments
      // If the balance is very small compared to a typical payment, consider it paid off
      const isRoundingError = bal < (payment * 0.01); // Less than 1% of a payment
      
      if (!isRoundingError) {
        const payoffInterest = round2(bal * r);
        const payoffTotal = round2(bal + payoffInterest);
        totalInterest = round2(totalInterest + payoffInterest);
        totalPaid = round2(totalPaid + payoffTotal);
        bal = 0;
        rows.push({
          idx: m + 1,
          date: addMonths(startYM, m),
          payment: payoffTotal,
          interest: payoffInterest,
          principal: round2(payoffTotal - payoffInterest),
          extra: 0,
          total: payoffTotal,
          balance: 0,
        });
        break;
      } else {
        // For rounding errors, just zero out the balance without adding an extra month
        bal = 0;
        break;
      }
    }
  }

  const chart = rows.map((r) => ({ name: `${r.idx}\n${r.date}`, balance: r.balance }));

  return {
    rows,
    totalInterest,
    totalPaid,
    payoffMonth: rows[rows.length - 1]?.idx ?? 0,
    segments,
    chart,
  };
};
