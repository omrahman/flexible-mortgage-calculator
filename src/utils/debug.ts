// Debug utilities for mortgage calculator

import type { CachedInputs, ScheduleResult, ScheduleParams } from '../types';
import { fmtUSD } from './formatters';

export interface DebugData {
  timestamp: string;
  version: string;
  inputs: {
    loan: {
      homePrice: string;
      downPayment: {
        type: 'percentage' | 'dollar';
        value: string;
      };
      principal: number;
      interestRate: string;
      termYears: string;
      termMonths: number;
      startDate: string;
    };
    property: {
      propertyTaxAnnual: string;
      insuranceAnnual: string;
      monthlyPITI: {
        propertyTax: number;
        insurance: number;
        total: number;
      };
    };
    extraPayments: Array<{
      id: string;
      month: number;
      amount: number;
      isForgiveness: boolean;
      isRecurring: boolean;
      recurringQuantity?: number;
      recurringFrequency?: 'monthly' | 'annually';
    }>;
    recastSettings: {
      autoRecast: boolean;
      recastMonthsText: string;
      recastMonths: number[];
    };
    displaySettings: {
      showAll: boolean;
    };
  };
  calculations: {
    baseline: {
      totalInterest: number;
      totalPaid: number;
      payoffMonth: number;
      monthlyPayment: number;
    };
    result: {
      totalInterest: number;
      totalPaid: number;
      totalForgiveness: number;
      payoffMonth: number;
      monthlyPayment: number;
      segments: Array<{
        start: number;
        payment: number;
      }>;
    };
    savings: {
      interestSaved: number;
      monthsSaved: number;
    };
  };
  scheduleParams: ScheduleParams;
  rawData: {
    cachedInputs: CachedInputs;
    baselineResult: ScheduleResult;
    result: ScheduleResult;
  };
}

export function createDebugData(
  cachedInputs: CachedInputs,
  principal: number,
  termMonths: number,
  monthlyPITI: { propertyTax: number; insurance: number; total: number },
  baseline: ScheduleResult,
  result: ScheduleResult,
  interestSaved: number,
  monthsSaved: number,
  scheduleParams: ScheduleParams
): DebugData {
  // Extract recast months from the schedule params
  const recastMonths = Array.from(scheduleParams.recastMonths).sort((a, b) => a - b);

  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    inputs: {
      loan: {
        homePrice: cachedInputs.homePrice,
        downPayment: cachedInputs.downPayment,
        principal: principal,
        interestRate: cachedInputs.rate,
        termYears: cachedInputs.termYears,
        termMonths: termMonths,
        startDate: cachedInputs.startYM,
      },
      property: {
        propertyTaxAnnual: cachedInputs.propertyTaxAnnual,
        insuranceAnnual: cachedInputs.insuranceAnnual,
        monthlyPITI: monthlyPITI,
      },
      extraPayments: cachedInputs.extras.map(extra => ({
        id: extra.id,
        month: extra.month,
        amount: extra.amount,
        isForgiveness: extra.isForgiveness || false,
        isRecurring: extra.isRecurring || false,
        recurringQuantity: extra.recurringQuantity,
        recurringFrequency: extra.recurringFrequency,
      })),
      recastSettings: {
        autoRecast: cachedInputs.autoRecast,
        recastMonthsText: cachedInputs.recastMonthsText || '',
        recastMonths: recastMonths,
      },
      displaySettings: {
        showAll: cachedInputs.showAll,
      },
    },
    calculations: {
      baseline: {
        totalInterest: baseline.totalInterest,
        totalPaid: baseline.totalPaid,
        payoffMonth: baseline.payoffMonth,
        monthlyPayment: baseline.segments[0]?.payment || 0,
      },
      result: {
        totalInterest: result.totalInterest,
        totalPaid: result.totalPaid,
        totalForgiveness: result.totalForgiveness,
        payoffMonth: result.payoffMonth,
        monthlyPayment: result.segments[result.segments.length - 1]?.payment || 0,
        segments: result.segments,
      },
      savings: {
        interestSaved: interestSaved,
        monthsSaved: monthsSaved,
      },
    },
    scheduleParams: scheduleParams,
    rawData: {
      cachedInputs: cachedInputs,
      baselineResult: baseline,
      result: result,
    },
  };
}

export function logDebugData(debugData: DebugData): void {
  console.group('🏠 Mortgage Calculator Debug Data');
  console.log('📊 Summary:', {
    'Home Price': fmtUSD(parseFloat(debugData.inputs.loan.homePrice) || 0),
    'Principal': fmtUSD(debugData.inputs.loan.principal),
    'Interest Rate': `${debugData.inputs.loan.interestRate}%`,
    'Term': `${debugData.inputs.loan.termYears} years (${debugData.inputs.loan.termMonths} months)`,
    'Monthly Payment': fmtUSD(debugData.calculations.result.monthlyPayment),
    'Total Interest': fmtUSD(debugData.calculations.result.totalInterest),
    'Interest Saved': fmtUSD(debugData.calculations.savings.interestSaved),
    'Months Saved': debugData.calculations.savings.monthsSaved,
  });
  console.log('🔧 Full Debug Data:', debugData);
  console.groupEnd();
}

export function exportDebugData(debugData: DebugData): string {
  return JSON.stringify(debugData, null, 2);
}

