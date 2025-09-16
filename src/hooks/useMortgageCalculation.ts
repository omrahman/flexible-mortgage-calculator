// Custom hook for mortgage calculation logic

import { useMemo, useState } from 'react';
import { buildSchedule, parseMonthInput } from '../utils/calculations';
import { round2 } from '../utils/formatters';
import type { ExtraItem, ExtraMap, ScheduleParams } from '../types';
import { DEFAULT_LOAN_AMOUNT, DEFAULT_INTEREST_RATE, DEFAULT_TERM_YEARS, DEFAULT_EXTRA_PAYMENTS } from '../constants';

export const useMortgageCalculation = () => {
  const [principal, setPrincipal] = useState(DEFAULT_LOAN_AMOUNT);
  const [rate, setRate] = useState(DEFAULT_INTEREST_RATE);
  const [termYears, setTermYears] = useState(DEFAULT_TERM_YEARS);
  const [startYM, setStartYM] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${y}-${m}`;
  });

  const [extras, setExtras] = useState<ExtraItem[]>(DEFAULT_EXTRA_PAYMENTS);
  const [autoRecast, setAutoRecast] = useState(true);
  const [recastMonthsText, setRecastMonthsText] = useState("");
  const [showAll, setShowAll] = useState(false);

  const termMonths = Math.max(1, Math.round(Number(termYears) * 12));

  const extrasMap = useMemo(() => {
    const map: ExtraMap = {};
    for (const e of extras) {
      if (!Number.isFinite(e.month) || e.month < 1) continue;
      const startMonth = Math.min(termMonths, Math.round(e.month));
      const amount = Math.max(0, e.amount);
      
      if (e.isRecurring) {
        // Handle recurring payments
        const quantity = e.recurringQuantity || 1;
        const endMonth = e.recurringEndMonth || (startMonth + quantity - 1);
        const actualEndMonth = Math.min(termMonths, endMonth);
        const actualQuantity = Math.min(quantity, actualEndMonth - startMonth + 1);
        
        for (let i = 0; i < actualQuantity; i++) {
          const month = startMonth + i;
          if (month <= termMonths) {
            map[month] = round2((map[month] || 0) + amount);
          }
        }
      } else {
        // Handle single payment
        map[startMonth] = round2((map[startMonth] || 0) + amount);
      }
    }
    return map;
  }, [extras, termMonths]);

  const recastSet = useMemo(() => {
    const set = new Set<number>();
    for (const m of parseMonthInput(recastMonthsText)) set.add(m);
    return set;
  }, [recastMonthsText]);

  const params = useMemo(
    (): ScheduleParams => ({
      principal: Number(principal) || 0,
      annualRatePct: Number(rate) || 0,
      termMonths,
      startYM,
      extras: extrasMap,
      recastMonths: recastSet,
      autoRecastOnExtra: autoRecast,
    }),
    [principal, rate, termMonths, startYM, extrasMap, recastSet, autoRecast]
  );

  const result = useMemo(() => buildSchedule(params), [params]);

  const baseline = useMemo(
    () =>
      buildSchedule({
        principal: params.principal,
        annualRatePct: params.annualRatePct,
        termMonths: params.termMonths,
        startYM: params.startYM,
        extras: {},
        recastMonths: new Set<number>(),
        autoRecastOnExtra: false,
      }),
    [params.principal, params.annualRatePct, params.termMonths, params.startYM]
  );

  const interestSaved = round2(baseline.totalInterest - result.totalInterest);
  const monthsSaved = Math.max(0, baseline.payoffMonth - result.payoffMonth);

  const handleAddExtra = () => {
    setExtras((xs) => [
      ...xs,
      { id: crypto.randomUUID(), month: 1, amount: 1000 },
    ]);
  };

  const handleRemoveExtra = (id: string) => {
    setExtras((xs) => xs.filter((x) => x.id !== id));
  };

  const handleUpdateExtra = (id: string, field: keyof ExtraItem, value: number | boolean) => {
    setExtras((xs) => xs.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  return {
    // State
    principal,
    setPrincipal,
    rate,
    setRate,
    termYears,
    setTermYears,
    startYM,
    setStartYM,
    extras,
    autoRecast,
    setAutoRecast,
    recastMonthsText,
    setRecastMonthsText,
    showAll,
    setShowAll,
    
    // Computed values
    termMonths,
    result,
    baseline,
    interestSaved,
    monthsSaved,
    
    // Handlers
    handleAddExtra,
    handleRemoveExtra,
    handleUpdateExtra,
  };
};
