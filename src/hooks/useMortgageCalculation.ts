// Custom hook for mortgage calculation logic

import { useMemo, useCallback } from 'react';
import { getCalculationResults } from '../logic/mortgageLogic';
import type { ExtraItem, CachedInputs, RecurringFrequency, DownPaymentInput } from '../types';
import {
  DEFAULT_HOME_PRICE,
  DEFAULT_DOWN_PAYMENT,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEFAULT_PROPERTY_TAX_ANNUAL,
  DEFAULT_INSURANCE_ANNUAL,
  DEFAULT_EXTRA_PAYMENTS,
  DEFAULT_AUTORECAST,
} from '../constants';
import { useLocalStorage } from './useLocalStorage';

export const useMortgageCalculation = () => {
  const defaultCachedInputs: CachedInputs = {
    homePrice: DEFAULT_HOME_PRICE,
    downPayment: DEFAULT_DOWN_PAYMENT,
    rate: DEFAULT_INTEREST_RATE,
    termYears: DEFAULT_TERM_YEARS,
    startYM: (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${y}-${m}`;
    })(),
    propertyTaxAnnual: DEFAULT_PROPERTY_TAX_ANNUAL,
    insuranceAnnual: DEFAULT_INSURANCE_ANNUAL,
    extras: DEFAULT_EXTRA_PAYMENTS,
    autoRecast: DEFAULT_AUTORECAST,
    showAll: false,
  };

  const [cachedInputs, setCachedInputs, clearCachedInputs] = useLocalStorage<CachedInputs>(
    'mortgage-calculator-inputs',
    defaultCachedInputs
  );

  const [loadedConfigurationId, setLoadedConfigurationId] = useLocalStorage<string | null>(
    'mortgage-calculator-loaded-config-id',
    null
  );

  const [originalInputs, setOriginalInputs] = useLocalStorage<CachedInputs | null>(
    'mortgage-calculator-original-inputs',
    null
  );

  const {
    principal,
    termMonths,
    monthlyPITI,
    result,
    baseline,
    interestSaved,
    monthsSaved,
    scheduleParams,
  } = useMemo(() => getCalculationResults(cachedInputs), [cachedInputs]);

  // Individual setters that update the cached inputs
  const setHomePrice = (value: string) => setCachedInputs(prev => ({ ...prev, homePrice: value }));
  const setDownPayment = (value: DownPaymentInput) => setCachedInputs(prev => ({ ...prev, downPayment: value }));
  const setPropertyTaxAnnual = (value: string) => setCachedInputs(prev => ({ ...prev, propertyTaxAnnual: value }));
  const setInsuranceAnnual = (value: string) => setCachedInputs(prev => ({ ...prev, insuranceAnnual: value }));
  const setRate = (value: string) => setCachedInputs(prev => ({ ...prev, rate: value }));
  const setTermYears = (value: string) => setCachedInputs(prev => ({ ...prev, termYears: value }));
  const setStartYM = (value: string) => setCachedInputs(prev => ({ ...prev, startYM: value }));
  const setExtras = (value: ExtraItem[] | ((prev: ExtraItem[]) => ExtraItem[])) =>
    setCachedInputs(prev => ({
      ...prev,
      extras: typeof value === 'function' ? value(prev.extras) : value,
    }));
  const setAutoRecast = (value: boolean) => setCachedInputs(prev => ({ ...prev, autoRecast: value }));
  const setRecastMonthsText = (value: string) => setCachedInputs(prev => ({ ...prev, recastMonthsText: value }));
  const setShowAll = (value: boolean) => setCachedInputs(prev => ({ ...prev, showAll: value }));

  const handleAddExtra = () => {
    setExtras(xs => [
      ...xs,
      { 
        id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        month: 1, 
        amount: 1000,
        isForgiveness: false,
        isRecurring: false,
        recurringQuantity: 1,
        recurringFrequency: 'monthly',
        defaultOpen: true,
      },
    ]);
  };

  const handleRemoveExtra = (id: string) => {
    setExtras(xs => xs.filter(x => x.id !== id));
  };

  const handleUpdateExtra = (
    id: string,
    fieldOrUpdates: keyof ExtraItem | Partial<ExtraItem>,
    value?: number | boolean | RecurringFrequency
  ) => {
    setExtras(xs =>
      xs.map(x => {
        if (x.id === id) {
          return typeof fieldOrUpdates === 'string'
            ? { ...x, [fieldOrUpdates]: value }
            : { ...x, ...fieldOrUpdates };
        }
        return x;
      })
    );
  };

  const clearAllInputs = () => {
    clearCachedInputs();
    clearLoadedConfiguration();
  };

  const loadConfiguration = useCallback((configInputs: CachedInputs, configId?: string) => {
    setCachedInputs(configInputs);
    setLoadedConfigurationId(configId || null);
    setOriginalInputs(configInputs);
  }, [setCachedInputs, setLoadedConfigurationId, setOriginalInputs]);

  const clearLoadedConfiguration = useCallback(() => {
    setLoadedConfigurationId(null);
    setOriginalInputs(null);
  }, [setLoadedConfigurationId, setOriginalInputs]);

  const markChangesAsSaved = () => {
    if (loadedConfigurationId) {
      setOriginalInputs(cachedInputs);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!loadedConfigurationId || !originalInputs) return false;
    return JSON.stringify(cachedInputs) !== JSON.stringify(originalInputs);
  }, [loadedConfigurationId, originalInputs, cachedInputs]);

  return {
    ...cachedInputs,
    setHomePrice,
    setDownPayment,
    principal,
    setRate,
    setTermYears,
    setStartYM,
    setPropertyTaxAnnual,
    setInsuranceAnnual,
    setExtras,
    setAutoRecast,
    setRecastMonthsText,
    setShowAll,
    termMonths,
    monthlyPITI,
    result,
    baseline,
    interestSaved,
    monthsSaved,
    cachedInputs,
    params: scheduleParams,
    handleAddExtra,
    handleRemoveExtra,
    handleUpdateExtra,
    clearAllInputs,
    loadConfiguration,
    clearLoadedConfiguration,
    markChangesAsSaved,
    loadedConfigurationId,
    hasUnsavedChanges,
  };
};
