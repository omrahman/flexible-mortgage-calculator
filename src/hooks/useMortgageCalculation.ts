// Custom hook for mortgage calculation logic

import { useMemo } from 'react';
import { buildSchedule, parseMonthInput } from '../utils/calculations';
import { round2 } from '../utils/formatters';
import type { ExtraItem, ExtraMap, ScheduleParams, CachedInputs } from '../types';
import { DEFAULT_LOAN_AMOUNT, DEFAULT_INTEREST_RATE, DEFAULT_TERM_YEARS, DEFAULT_EXTRA_PAYMENTS } from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useMortgageCalculation = () => {
  // Default values for cached inputs
  const defaultCachedInputs: CachedInputs = {
    principal: DEFAULT_LOAN_AMOUNT,
    rate: DEFAULT_INTEREST_RATE,
    termYears: DEFAULT_TERM_YEARS,
    startYM: (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, "0");
      return `${y}-${m}`;
    })(),
    extras: DEFAULT_EXTRA_PAYMENTS,
    autoRecast: true,
    // recastMonthsText is optional - only set when user specifies recast months
    showAll: false,
  };

  // Use localStorage to persist all user inputs
  const [cachedInputs, setCachedInputs, clearCachedInputs] = useLocalStorage<CachedInputs>(
    'mortgage-calculator-inputs',
    defaultCachedInputs
  );

  // Track which configuration is currently loaded (if any)
  const [loadedConfigurationId, setLoadedConfigurationId] = useLocalStorage<string | null>(
    'mortgage-calculator-loaded-config-id',
    null
  );

  // Track the original inputs when a configuration is loaded
  const [originalInputs, setOriginalInputs] = useLocalStorage<CachedInputs | null>(
    'mortgage-calculator-original-inputs',
    null
  );

  // Extract individual values from cached inputs
  const principal = cachedInputs.principal;
  const rate = cachedInputs.rate;
  const termYears = cachedInputs.termYears;
  const startYM = cachedInputs.startYM;
  const extras = cachedInputs.extras;
  const autoRecast = cachedInputs.autoRecast;
  const recastMonthsText = cachedInputs.recastMonthsText || '';
  const showAll = cachedInputs.showAll;

  // Individual setters that update the cached inputs
  const setPrincipal = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, principal: value }));
  };

  const setRate = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, rate: value }));
  };

  const setTermYears = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, termYears: value }));
  };

  const setStartYM = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, startYM: value }));
  };

  const setExtras = (value: ExtraItem[] | ((prev: ExtraItem[]) => ExtraItem[])) => {
    setCachedInputs((prev: CachedInputs) => ({ 
      ...prev, 
      extras: typeof value === 'function' ? value(prev.extras) : value 
    }));
  };

  const setAutoRecast = (value: boolean) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, autoRecast: value }));
  };

  const setRecastMonthsText = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, recastMonthsText: value }));
  };

  const setShowAll = (value: boolean) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, showAll: value }));
  };

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

  // Function to clear all cached inputs (useful for reset functionality)
  const clearAllInputs = () => {
    clearCachedInputs();
  };

  // Function to load a configuration
  const loadConfiguration = (configInputs: CachedInputs, configId?: string) => {
    setCachedInputs(configInputs);
    setLoadedConfigurationId(configId || null);
    setOriginalInputs(configInputs); // Store original inputs for comparison
  };

  // Function to clear loaded configuration tracking
  const clearLoadedConfiguration = () => {
    setLoadedConfigurationId(null);
    setOriginalInputs(null);
  };

  // Function to mark changes as saved (reset original inputs to current)
  const markChangesAsSaved = () => {
    if (loadedConfigurationId) {
      setOriginalInputs(cachedInputs);
    }
  };

  // Function to check if current inputs have been modified from the loaded configuration
  const hasUnsavedChanges = useMemo(() => {
    if (!loadedConfigurationId || !originalInputs) {
      return false;
    }
    
    return (
      cachedInputs.principal !== originalInputs.principal ||
      cachedInputs.rate !== originalInputs.rate ||
      cachedInputs.termYears !== originalInputs.termYears ||
      cachedInputs.startYM !== originalInputs.startYM ||
      cachedInputs.autoRecast !== originalInputs.autoRecast ||
      (cachedInputs.recastMonthsText || '') !== (originalInputs.recastMonthsText || '') ||
      cachedInputs.showAll !== originalInputs.showAll ||
      JSON.stringify(cachedInputs.extras) !== JSON.stringify(originalInputs.extras)
    );
  }, [loadedConfigurationId, originalInputs, cachedInputs]);

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
    clearAllInputs,
    loadConfiguration,
    clearLoadedConfiguration,
    markChangesAsSaved,
    
    // State
    loadedConfigurationId,
    hasUnsavedChanges,
  };
};
