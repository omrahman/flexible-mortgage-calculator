// Custom hook for mortgage calculation logic

import { useMemo } from 'react';
import { buildSchedule, parseMonthInput } from '../utils/calculations';
import { round2 } from '../utils/formatters';
import type { ExtraItem, ExtraMap, ScheduleParams, CachedInputs } from '../types';
import { DEFAULT_HOME_PRICE, DEFAULT_DOWN_PAYMENT, DEFAULT_INTEREST_RATE, DEFAULT_TERM_YEARS, DEFAULT_PROPERTY_TAX_ANNUAL, DEFAULT_INSURANCE_ANNUAL, DEFAULT_EXTRA_PAYMENTS } from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useMortgageCalculation = () => {
  // Default values for cached inputs
  const defaultCachedInputs: CachedInputs = {
    homePrice: DEFAULT_HOME_PRICE,
    downPayment: DEFAULT_DOWN_PAYMENT,
    rate: DEFAULT_INTEREST_RATE,
    termYears: DEFAULT_TERM_YEARS,
    startYM: (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, "0");
      return `${y}-${m}`;
    })(),
    propertyTaxAnnual: DEFAULT_PROPERTY_TAX_ANNUAL,
    insuranceAnnual: DEFAULT_INSURANCE_ANNUAL,
    extras: DEFAULT_EXTRA_PAYMENTS,
    autoRecast: true,
    // recastMonthsText is optional - only set when user specifies recast months
    showAll: false,
  };

  // Migration function to handle old data structure
  const migrateCachedInputs = (inputs: any): CachedInputs => {
    // If it's already the new structure, return as is
    if (inputs.homePrice && inputs.downPayment) {
      return {
        ...inputs,
        propertyTaxAnnual: inputs.propertyTaxAnnual || DEFAULT_PROPERTY_TAX_ANNUAL,
        insuranceAnnual: inputs.insuranceAnnual || DEFAULT_INSURANCE_ANNUAL,
      };
    }
    
    // Migrate from old structure
    return {
      homePrice: inputs.principal || DEFAULT_HOME_PRICE,
      downPayment: DEFAULT_DOWN_PAYMENT,
      rate: inputs.rate || DEFAULT_INTEREST_RATE,
      termYears: inputs.termYears || DEFAULT_TERM_YEARS,
      startYM: inputs.startYM || (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, "0");
        return `${y}-${m}`;
      })(),
      propertyTaxAnnual: inputs.propertyTaxAnnual || DEFAULT_PROPERTY_TAX_ANNUAL,
      insuranceAnnual: inputs.insuranceAnnual || DEFAULT_INSURANCE_ANNUAL,
      extras: inputs.extras || DEFAULT_EXTRA_PAYMENTS,
      autoRecast: inputs.autoRecast !== undefined ? inputs.autoRecast : true,
      recastMonthsText: inputs.recastMonthsText,
      showAll: inputs.showAll || false,
    };
  };

  // Use localStorage to persist all user inputs with migration
  const [rawCachedInputs, setRawCachedInputs, clearCachedInputs] = useLocalStorage<any>(
    'mortgage-calculator-inputs',
    defaultCachedInputs
  );
  
  // Migrate the cached inputs to the new structure
  const cachedInputs = useMemo(() => migrateCachedInputs(rawCachedInputs), [rawCachedInputs]);
  
  // Wrapper for setCachedInputs that ensures the new structure
  const setCachedInputs = (value: CachedInputs | ((prev: CachedInputs) => CachedInputs)) => {
    if (typeof value === 'function') {
      setRawCachedInputs((prev: any) => {
        const migrated = migrateCachedInputs(prev);
        return value(migrated);
      });
    } else {
      setRawCachedInputs(value);
    }
  };

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

  // Extract individual values from cached inputs (now guaranteed to be in new structure)
  const homePrice = cachedInputs.homePrice;
  const downPayment = cachedInputs.downPayment;
  const rate = cachedInputs.rate;
  const termYears = cachedInputs.termYears;
  const startYM = cachedInputs.startYM;
  const propertyTaxAnnual = cachedInputs.propertyTaxAnnual;
  const insuranceAnnual = cachedInputs.insuranceAnnual;
  const extras = cachedInputs.extras;
  const autoRecast = cachedInputs.autoRecast;
  const recastMonthsText = cachedInputs.recastMonthsText || '';

  // Calculate principal (loan amount) from home price and down payment
  const principal = useMemo(() => {
    const homePriceNum = parseFloat(homePrice) || 0;
    const downPaymentValue = parseFloat(downPayment.value) || 0;
    
    if (downPayment.type === 'percentage') {
      return homePriceNum * (1 - downPaymentValue / 100);
    } else {
      return Math.max(0, homePriceNum - downPaymentValue);
    }
  }, [homePrice, downPayment]);

  // Calculate monthly PITI payment components
  const monthlyPITI = useMemo(() => {
    const propertyTaxMonthly = (parseFloat(propertyTaxAnnual) || 0) / 12;
    const insuranceMonthly = (parseFloat(insuranceAnnual) || 0) / 12;
    
    return {
      propertyTax: round2(propertyTaxMonthly),
      insurance: round2(insuranceMonthly),
      total: round2(propertyTaxMonthly + insuranceMonthly),
    };
  }, [propertyTaxAnnual, insuranceAnnual]);

  const showAll = cachedInputs.showAll;

  // Individual setters that update the cached inputs
  const setHomePrice = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, homePrice: value }));
  };

  const setDownPayment = (value: any) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, downPayment: value }));
  };

  const setPropertyTaxAnnual = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, propertyTaxAnnual: value }));
  };

  const setInsuranceAnnual = (value: string) => {
    setCachedInputs((prev: CachedInputs) => ({ ...prev, insuranceAnnual: value }));
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
      cachedInputs.homePrice !== originalInputs.homePrice ||
      JSON.stringify(cachedInputs.downPayment) !== JSON.stringify(originalInputs.downPayment) ||
      cachedInputs.rate !== originalInputs.rate ||
      cachedInputs.termYears !== originalInputs.termYears ||
      cachedInputs.startYM !== originalInputs.startYM ||
      cachedInputs.propertyTaxAnnual !== originalInputs.propertyTaxAnnual ||
      cachedInputs.insuranceAnnual !== originalInputs.insuranceAnnual ||
      cachedInputs.autoRecast !== originalInputs.autoRecast ||
      (cachedInputs.recastMonthsText || '') !== (originalInputs.recastMonthsText || '') ||
      cachedInputs.showAll !== originalInputs.showAll ||
      JSON.stringify(cachedInputs.extras) !== JSON.stringify(originalInputs.extras)
    );
  }, [loadedConfigurationId, originalInputs, cachedInputs]);

  return {
    // State
    homePrice,
    setHomePrice,
    downPayment,
    setDownPayment,
    principal, // calculated from home price and down payment
    rate,
    setRate,
    termYears,
    setTermYears,
    startYM,
    setStartYM,
    propertyTaxAnnual,
    setPropertyTaxAnnual,
    insuranceAnnual,
    setInsuranceAnnual,
    extras,
    autoRecast,
    setAutoRecast,
    recastMonthsText,
    setRecastMonthsText,
    showAll,
    setShowAll,
    
    // Computed values
    termMonths,
    monthlyPITI,
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
