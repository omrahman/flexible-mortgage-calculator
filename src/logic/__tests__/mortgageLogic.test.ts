// src/logic/__tests__/mortgageLogic.test.ts
import {
  calculatePrincipal,
  calculateMonthlyPITI,
  mapExtras,
  getCalculationResults,
} from '../mortgageLogic';
import type { CachedInputs, DownPaymentInput, ExtraItem } from '../../types';

describe('mortgageLogic.ts', () => {
  describe('calculatePrincipal()', () => {
    it('should calculate principal correctly for percentage down payment', () => {
      const dp: DownPaymentInput = { type: 'percentage', value: '20' };
      expect(calculatePrincipal('100000', dp)).toBe(80000);
    });

    it('should calculate principal correctly for amount down payment', () => {
      const dp: DownPaymentInput = { type: 'amount', value: '25000' };
      expect(calculatePrincipal('100000', dp)).toBe(75000);
    });
  });

  describe('calculateMonthlyPITI()', () => {
    it('should calculate monthly PITI from annual values', () => {
      const piti = calculateMonthlyPITI('12000', '1200'); // $1k/mo tax, $100/mo insurance
      expect(piti.propertyTax).toBe(1000);
      expect(piti.insurance).toBe(100);
      expect(piti.total).toBe(1100);
    });
  });

  describe('mapExtras()', () => {
    const extras: ExtraItem[] = [
      { id: '1', month: 1, amount: 100 },
      { id: '2', month: 2, amount: 200, isForgiveness: true },
      { id: '3', month: 13, amount: 50, isRecurring: true, recurringFrequency: 'annually', recurringQuantity: 3 },
    ];
    const termMonths = 360;
    const { extrasMap, forgivenessMap } = mapExtras(extras, termMonths);

    it('should map one-time extra payments correctly', () => {
      expect(extrasMap[1]).toBe(100);
    });

    it('should map forgiveness payments correctly', () => {
      expect(forgivenessMap[2]).toBe(200);
    });

    it('should map recurring payments correctly', () => {
      expect(extrasMap[13]).toBe(50); // Year 2
      expect(extrasMap[25]).toBe(50); // Year 3
      expect(extrasMap[37]).toBe(50); // Year 4
      expect(extrasMap[49]).toBeUndefined();
    });
  });

  describe('getCalculationResults()', () => {
    const baseInputs: CachedInputs = {
      homePrice: '100000',
      downPayment: { type: 'amount', value: '25000' },
      rate: '6',
      termYears: '30',
      startYM: '2024-01',
      propertyTaxAnnual: '1200',
      insuranceAnnual: '600',
      extras: [],
      autoRecast: false,
      recastMonthsText: '',
      showAll: false,
    };

    it('should produce a complete set of calculation results', () => {
      const results = getCalculationResults(baseInputs);
      expect(results.principal).toBe(75000);
      expect(results.termMonths).toBe(360);
      expect(results.monthlyPITI.total).toBe(150);
      expect(results.result.payoffMonth).toBe(360);
      expect(results.baseline.payoffMonth).toBe(360);
      expect(results.interestSaved).toBe(0);
      expect(results.monthsSaved).toBe(0);
    });

    it('should calculate savings when extra payments are included', () => {
      const inputsWithExtras: CachedInputs = {
        ...baseInputs,
        extras: [{ id: '1', month: 1, amount: 10000 }],
      };
      const results = getCalculationResults(inputsWithExtras);
      expect(results.interestSaved).toBeGreaterThan(0);
      expect(results.monthsSaved).toBeGreaterThan(0);
    });
  });
});
