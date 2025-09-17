// src/logic/mortgageLogic.ts
import { buildSchedule, parseMonthInput } from '../utils/calculations';
import { round2 } from '../utils/formatters';
import type {
  ExtraItem,
  ExtraMap,
  ForgivenessMap,
  ScheduleParams,
  CachedInputs,
  DownPaymentInput,
} from '../types';

export const calculatePrincipal = (homePrice: string, downPayment: DownPaymentInput): number => {
  const homePriceNum = parseFloat(homePrice) || 0;
  const downPaymentValue = parseFloat(downPayment.value) || 0;

  if (downPayment.type === 'percentage') {
    return homePriceNum * (1 - downPaymentValue / 100);
  }
  return Math.max(0, homePriceNum - downPaymentValue);
};

export const calculateMonthlyPITI = (propertyTaxAnnual: string, insuranceAnnual: string) => {
  const propertyTaxMonthly = (parseFloat(propertyTaxAnnual) || 0) / 12;
  const insuranceMonthly = (parseFloat(insuranceAnnual) || 0) / 12;

  return {
    propertyTax: round2(propertyTaxMonthly),
    insurance: round2(insuranceMonthly),
    total: round2(propertyTaxMonthly + insuranceMonthly),
  };
};

export const mapExtras = (extras: ExtraItem[], termMonths: number): { extrasMap: ExtraMap; forgivenessMap: ForgivenessMap } => {
  const extrasMap: ExtraMap = {};
  const forgivenessMap: ForgivenessMap = {};

  for (const e of extras) {
    const targetMap = e.isForgiveness ? forgivenessMap : extrasMap;
    if (!Number.isFinite(e.month) || e.month < 1) continue;

    const startMonth = Math.min(termMonths, Math.round(e.month));
    const amount = Math.max(0, e.amount);

    if (e.isRecurring) {
      const quantity = e.recurringQuantity || 1;
      const frequency = e.recurringFrequency || 'monthly';
      const interval = frequency === 'annually' ? 12 : 1;
      
      for (let i = 0; i < quantity; i++) {
        const month = startMonth + i * interval;
        if (month <= termMonths) {
          targetMap[month] = round2((targetMap[month] || 0) + amount);
        }
      }
    } else {
      targetMap[startMonth] = round2((targetMap[startMonth] || 0) + amount);
    }
  }
  return { extrasMap, forgivenessMap };
};

export const getCalculationResults = (inputs: CachedInputs) => {
  const principal = calculatePrincipal(inputs.homePrice, inputs.downPayment);
  const termMonths = Math.max(1, Math.round((Number(inputs.termYears) || 0) * 12));
  const { extrasMap, forgivenessMap } = mapExtras(inputs.extras, termMonths);
  const recastSet = new Set(parseMonthInput(inputs.recastMonthsText ?? ''));

  const params: ScheduleParams = {
    principal,
    annualRatePct: Number(inputs.rate) || 0,
    termMonths,
    startYM: inputs.startYM,
    extras: extrasMap,
    forgiveness: forgivenessMap,
    recastMonths: recastSet,
    autoRecastOnExtra: inputs.autoRecast,
  };

  const result = buildSchedule(params);

  const baselineParams: ScheduleParams = {
    ...params,
    extras: {},
    forgiveness: {},
    recastMonths: new Set(),
    autoRecastOnExtra: false,
  };

  const baseline = buildSchedule(baselineParams);

  const interestSaved = round2(baseline.totalInterest - result.totalInterest);
  const monthsSaved = Math.max(0, baseline.payoffMonth - result.payoffMonth);

  return {
    principal,
    termMonths,
    monthlyPITI: calculateMonthlyPITI(inputs.propertyTaxAnnual, inputs.insuranceAnnual),
    result,
    baseline,
    interestSaved,
    monthsSaved,
    params,
  };
};
