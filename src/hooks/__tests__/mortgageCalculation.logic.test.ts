// Pure business logic tests for mortgage calculation
// These tests focus on the core business logic without React dependencies

import type { CachedInputs, ExtraItem } from '../../types';
import { buildSchedule } from '../../utils/calculations';
import { round2 } from '../../utils/formatters';

// Test the business logic functions that the hook uses
describe('Mortgage Calculation Business Logic', () => {
  const createDefaultInputs = (): CachedInputs => ({
    homePrice: '1000000',
    downPayment: { type: 'percentage', value: '20' },
    rate: '4.85',
    termYears: '30',
    startYM: '2024-01',
    propertyTaxAnnual: '12000',
    insuranceAnnual: '2400',
    extras: [],
    autoRecast: true,
    showAll: false,
  });

  describe('Principal Calculation', () => {
    it('should calculate principal for percentage down payment', () => {
      const inputs = createDefaultInputs();
      const homePriceNum = parseFloat(inputs.homePrice) || 0;
      const downPaymentValue = parseFloat(inputs.downPayment.value) || 0;
      
      let principal: number;
      if (inputs.downPayment.type === 'percentage') {
        principal = homePriceNum * (1 - downPaymentValue / 100);
      } else {
        principal = Math.max(0, homePriceNum - downPaymentValue);
      }

      // 20% down payment on $1M home = $800K principal
      expect(principal).toBe(800000);
    });

    it('should calculate principal for fixed down payment', () => {
      const inputs = createDefaultInputs();
      inputs.downPayment = { type: 'dollar', value: '200000' };
      
      const homePriceNum = parseFloat(inputs.homePrice) || 0;
      const downPaymentValue = parseFloat(inputs.downPayment.value) || 0;
      
      let principal: number;
      if (inputs.downPayment.type === 'percentage') {
        principal = homePriceNum * (1 - downPaymentValue / 100);
      } else {
        principal = Math.max(0, homePriceNum - downPaymentValue);
      }

      // $200K down payment on $1M home = $800K principal
      expect(principal).toBe(800000);
    });

    it('should handle edge cases in principal calculation', () => {
      const inputs = createDefaultInputs();
      inputs.homePrice = '0';
      inputs.downPayment = { type: 'percentage', value: '20' };
      
      const homePriceNum = parseFloat(inputs.homePrice) || 0;
      const downPaymentValue = parseFloat(inputs.downPayment.value) || 0;
      
      let principal: number;
      if (inputs.downPayment.type === 'percentage') {
        principal = homePriceNum * (1 - downPaymentValue / 100);
      } else {
        principal = Math.max(0, homePriceNum - downPaymentValue);
      }

      expect(principal).toBe(0);
    });
  });

  describe('Monthly PITI Calculation', () => {
    it('should calculate monthly property tax and insurance', () => {
      const inputs = createDefaultInputs();
      const propertyTaxMonthly = (parseFloat(inputs.propertyTaxAnnual) || 0) / 12;
      const insuranceMonthly = (parseFloat(inputs.insuranceAnnual) || 0) / 12;
      
      const monthlyPITI = {
        propertyTax: round2(propertyTaxMonthly),
        insurance: round2(insuranceMonthly),
        total: round2(propertyTaxMonthly + insuranceMonthly),
      };

      // Property tax: $12,000 / 12 = $1,000
      // Insurance: $2,400 / 12 = $200
      // Total: $1,200
      expect(monthlyPITI.propertyTax).toBe(1000);
      expect(monthlyPITI.insurance).toBe(200);
      expect(monthlyPITI.total).toBe(1200);
    });

    it('should handle zero values', () => {
      const inputs = createDefaultInputs();
      inputs.propertyTaxAnnual = '0';
      inputs.insuranceAnnual = '0';
      
      const propertyTaxMonthly = (parseFloat(inputs.propertyTaxAnnual) || 0) / 12;
      const insuranceMonthly = (parseFloat(inputs.insuranceAnnual) || 0) / 12;
      
      const monthlyPITI = {
        propertyTax: round2(propertyTaxMonthly),
        insurance: round2(insuranceMonthly),
        total: round2(propertyTaxMonthly + insuranceMonthly),
      };

      expect(monthlyPITI.propertyTax).toBe(0);
      expect(monthlyPITI.insurance).toBe(0);
      expect(monthlyPITI.total).toBe(0);
    });
  });

  describe('Term Months Calculation', () => {
    it('should calculate term months from years', () => {
      const termYears = '30';
      const termMonths = Math.max(1, Math.round((Number(termYears) || 0) * 12));
      
      expect(termMonths).toBe(360);
    });

    it('should handle edge cases', () => {
      expect(Math.max(1, Math.round((Number('0') || 0) * 12))).toBe(1);
      expect(Math.max(1, Math.round((Number('') || 0) * 12))).toBe(1);
      expect(Math.max(1, Math.round((Number('invalid') || 0) * 12))).toBe(1);
    });
  });

  describe('Extras Map Generation', () => {
    it('should create extras map from extra items', () => {
      const extras: ExtraItem[] = [
        { id: '1', month: 1, amount: 1000 },
        { id: '2', month: 12, amount: 5000 },
        { id: '3', month: 24, amount: 2000 },
      ];
      const termMonths = 360;
      
      const extrasMap: Record<number, number> = {};
      for (const e of extras) {
        if (!Number.isFinite(e.month) || e.month < 1) continue;
        const startMonth = Math.min(termMonths, Math.round(e.month));
        const amount = Math.max(0, e.amount);
        
        if (e.isRecurring) {
          // Handle recurring payments
          const quantity = e.recurringQuantity || 1;
          const frequency = e.recurringFrequency || 'monthly';
          const interval = (frequency as 'monthly' | 'annually') === 'annually' ? 12 : 1;
          const endMonth = e.recurringEndMonth || (startMonth + (quantity - 1) * interval);
          const actualEndMonth = Math.min(termMonths, endMonth);
          
          for (let i = 0; i < quantity; i++) {
            const month = startMonth + (i * interval);
            if (month <= termMonths && month <= actualEndMonth) {
              extrasMap[month] = round2((extrasMap[month] || 0) + amount);
            }
          }
        } else {
          // Handle single payment
          extrasMap[startMonth] = round2((extrasMap[startMonth] || 0) + amount);
        }
      }

      expect(extrasMap[1]).toBe(1000);
      expect(extrasMap[12]).toBe(5000);
      expect(extrasMap[24]).toBe(2000);
    });

    it('should handle recurring payments', () => {
      const extras: ExtraItem[] = [
        { 
          id: '1', 
          month: 1, 
          amount: 1000, 
          isRecurring: true, 
          recurringQuantity: 3, 
          recurringFrequency: 'monthly' as const 
        },
      ];
      const termMonths = 360;
      
      const extrasMap: Record<number, number> = {};
      for (const e of extras) {
        if (!Number.isFinite(e.month) || e.month < 1) continue;
        const startMonth = Math.min(termMonths, Math.round(e.month));
        const amount = Math.max(0, e.amount);
        
        if (e.isRecurring) {
          const quantity = e.recurringQuantity || 1;
          const frequency = e.recurringFrequency || 'monthly';
          const interval = (frequency as 'monthly' | 'annually') === 'annually' ? 12 : 1;
          const endMonth = e.recurringEndMonth || (startMonth + (quantity - 1) * interval);
          const actualEndMonth = Math.min(termMonths, endMonth);
          
          for (let i = 0; i < quantity; i++) {
            const month = startMonth + (i * interval);
            if (month <= termMonths && month <= actualEndMonth) {
              extrasMap[month] = round2((extrasMap[month] || 0) + amount);
            }
          }
        } else {
          extrasMap[startMonth] = round2((extrasMap[startMonth] || 0) + amount);
        }
      }

      expect(extrasMap[1]).toBe(1000);
      expect(extrasMap[2]).toBe(1000);
      expect(extrasMap[3]).toBe(1000);
    });
  });

  describe('Schedule Generation', () => {
    it('should generate schedule with basic parameters', () => {
      const principal = 800000;
      const annualRatePct = 4.85;
      const termMonths = 360;
      const startYM = '2024-01';
      
      const result = buildSchedule({
        principal,
        annualRatePct,
        termMonths,
        startYM,
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      });

      expect(result.rows).toHaveLength(360);
      expect(result.payoffMonth).toBe(360);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPaid).toBeGreaterThan(0);
    });

    it('should generate schedule with extra payments', () => {
      const principal = 800000;
      const annualRatePct = 4.85;
      const termMonths = 360;
      const startYM = '2024-01';
      const extras = { 1: 1000, 12: 5000 };
      
      const result = buildSchedule({
        principal,
        annualRatePct,
        termMonths,
        startYM,
        extras,
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      });

      expect(result.rows.length).toBeLessThanOrEqual(360);
      expect(result.rows[0].extra).toBe(1000);
      expect(result.rows[11].extra).toBe(5000);
      expect(result.payoffMonth).toBeLessThanOrEqual(360);
    });
  });

  describe('Interest and Time Savings Calculation', () => {
    it('should calculate interest and time savings', () => {
      const principal = 800000;
      const annualRatePct = 4.85;
      const termMonths = 360;
      const startYM = '2024-01';
      
      // Baseline schedule (no extras)
      const baseline = buildSchedule({
        principal,
        annualRatePct,
        termMonths,
        startYM,
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      });

      // Schedule with extras
      const result = buildSchedule({
        principal,
        annualRatePct,
        termMonths,
        startYM,
        extras: { 1: 1000, 12: 5000 },
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      });

      const interestSaved = round2(baseline.totalInterest - result.totalInterest);
      const monthsSaved = Math.max(0, baseline.payoffMonth - result.payoffMonth);

      expect(interestSaved).toBeGreaterThan(0);
      expect(monthsSaved).toBeGreaterThan(0);
    });
  });
});
