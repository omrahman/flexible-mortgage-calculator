import { buildSchedule } from '../utils/calculations';
import type { ScheduleParams } from '../types';

describe('Mortgage Calculator Integration Tests', () => {
  describe('Standard 30-Year Fixed Mortgage', () => {
    it('should calculate correct amortization for $500K loan at 4.5% for 30 years', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // Verify basic structure
      expect(result.rows).toHaveLength(360);
      expect(result.payoffMonth).toBe(360);
      expect(result.totalInterest).toBeCloseTo(411808.38, 2);
      expect(result.totalPaid).toBeCloseTo(911808.38, 2);

      // Verify first payment
      const firstPayment = result.rows[0];
      expect(firstPayment.payment).toBeCloseTo(2531.13, 2);
      expect(firstPayment.interest).toBeCloseTo(1875.00, 2);
      expect(firstPayment.principal).toBeCloseTo(656.13, 2);
      expect(firstPayment.balance).toBeCloseTo(499343.87, 2);

      // Verify last payment
      const lastPayment = result.rows[359];
      expect(lastPayment.balance).toBeCloseTo(0, 2);
      expect(lastPayment.payment).toBeCloseTo(2531.13, 2);
    });

    it('should calculate correct amortization for $1M loan at 6% for 30 years', () => {
      const params: ScheduleParams = {
        principal: 1000000,
        annualRatePct: 6,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.totalInterest).toBeCloseTo(115838.07, 2);
      expect(result.totalPaid).toBeCloseTo(215838.07, 2);
      expect(result.rows[0].payment).toBeCloseTo(599.55, 2);
    });
  });

  describe('Extra Payments Scenarios', () => {
    it('should handle single extra payment in month 12', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 12: 10000 },
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // Should pay off early
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBeLessThan(411808.38);

      // Check that extra payment was applied in month 12
      const twelfthMonth = result.rows[11];
      expect(twelfthMonth.extra).toBe(10000);
      expect(twelfthMonth.total).toBeCloseTo(12531.13, 2);
    });

    it('should handle multiple extra payments', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 
          12: 10000, 
          24: 15000, 
          36: 20000 
        },
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBeLessThan(411808.38);

      // Verify extra payments were applied
      expect(result.rows[11].extra).toBe(10000);
      expect(result.rows[23].extra).toBe(15000);
      expect(result.rows[35].extra).toBe(20000);
    });

    it('should handle large extra payment that pays off loan early', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 1: 100000 }, // Pay off entire loan in first month
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.rows).toHaveLength(1);
      expect(result.payoffMonth).toBe(1);
      expect(result.rows[0].balance).toBe(0);
      expect(result.rows[0].extra).toBe(100000);
    });
  });

  describe('Recast Scenarios', () => {
    it('should handle manual recast at specific months', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 12: 50000, 24: 50000 }, // Large extra payments
        recastMonths: new Set([12, 24]),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // Check that recasts occurred
      const twelfthMonth = result.rows[11];
      expect(twelfthMonth.recast).toBe(true);
      expect(twelfthMonth.newPayment).toBeDefined();
      expect(twelfthMonth.newPayment).not.toBe(twelfthMonth.payment);

      const twentyFourthMonth = result.rows[23];
      expect(twentyFourthMonth.recast).toBe(true);
      expect(twentyFourthMonth.newPayment).toBeDefined();
    });

    it('should handle auto-recast on extra payments', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 6: 25000, 18: 25000 },
        recastMonths: new Set(),
        autoRecastOnExtra: true,
      };

      const result = buildSchedule(params);

      // Check that recasts were triggered by extra payments
      const sixthMonth = result.rows[5];
      expect(sixthMonth.recast).toBe(true);
      expect(sixthMonth.newPayment).toBeDefined();

      const eighteenthMonth = result.rows[17];
      expect(eighteenthMonth.recast).toBe(true);
      expect(eighteenthMonth.newPayment).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero interest rate', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 0,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.totalInterest).toBe(0);
      expect(result.totalPaid).toBeCloseTo(100000, 2);
      expect(result.rows[0].payment).toBeCloseTo(277.78, 2);
      expect(result.rows[0].interest).toBe(0);
    });

    it('should handle very short term loan', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 5,
        termMonths: 12,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.rows).toHaveLength(12);
      expect(result.payoffMonth).toBe(12);
      expect(result.rows[11].balance).toBeCloseTo(0, 2);
    });

    it('should handle very high interest rate', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 20,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.rows[0].payment).toBeGreaterThan(10000);
      expect(result.totalInterest).toBeGreaterThan(1000000);
    });

    it('should handle very small loan amount', () => {
      const params: ScheduleParams = {
        principal: 1000,
        annualRatePct: 5,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      expect(result.rows).toHaveLength(360);
      expect(result.rows[0].payment).toBeCloseTo(5.37, 2);
    });
  });

  describe('Financial Accuracy Tests', () => {
    it('should maintain balance consistency throughout amortization', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 12: 10000, 24: 15000 },
        recastMonths: new Set([12, 24]),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // Verify that each month's balance calculation is correct
      let runningBalance = params.principal;
      
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        const expectedBalance = runningBalance - row.principal - row.extra;
        
        expect(row.balance).toBeCloseTo(expectedBalance, 2);
        runningBalance = row.balance;
      }
    });

    it('should maintain payment consistency', () => {
      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // All payments should be the same (no recasts)
      const firstPayment = result.rows[0].payment;
      for (let i = 1; i < result.rows.length; i++) {
        expect(result.rows[i].payment).toBeCloseTo(firstPayment, 2);
      }
    });

    it('should calculate interest correctly each month', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 6,
        termMonths: 360,
        startYM: '2024-01',
        extras: {},
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);
      const monthlyRate = 0.06 / 12;

      // Check first few months' interest calculations
      for (let i = 0; i < Math.min(5, result.rows.length); i++) {
        const row = result.rows[i];
        const expectedInterest = row.balance + row.principal + row.extra; // Balance before payment
        const calculatedInterest = expectedInterest * monthlyRate;
        
        expect(row.interest).toBeCloseTo(calculatedInterest, 2);
      }
    });

    it('should handle payment + extra = balance + interest constraint', () => {
      const params: ScheduleParams = {
        principal: 100000,
        annualRatePct: 6,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 1: 1000, 12: 5000 },
        recastMonths: new Set(),
        autoRecastOnExtra: false,
      };

      const result = buildSchedule(params);

      // Verify that payment + extra never exceeds balance + interest
      for (const row of result.rows) {
        const balanceBeforePayment = row.balance + row.principal + row.extra;
        const maxPayment = balanceBeforePayment;
        const actualPayment = row.payment + row.extra;
        
        expect(actualPayment).toBeLessThanOrEqual(maxPayment + 0.01); // Allow for rounding
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of extra payments efficiently', () => {
      const extras: { [key: number]: number } = {};
      for (let i = 1; i <= 360; i += 10) {
        extras[i] = 1000;
      }

      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras,
        recastMonths: new Set(),
        autoRecastOnExtra: true,
      };

      const startTime = performance.now();
      const result = buildSchedule(params);
      const endTime = performance.now();

      expect(result.rows.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle complex recast scenarios efficiently', () => {
      const recastMonths = new Set<number>();
      for (let i = 12; i <= 360; i += 12) {
        recastMonths.add(i);
      }

      const params: ScheduleParams = {
        principal: 500000,
        annualRatePct: 4.5,
        termMonths: 360,
        startYM: '2024-01',
        extras: { 12: 10000, 24: 15000, 36: 20000 },
        recastMonths,
        autoRecastOnExtra: false,
      };

      const startTime = performance.now();
      const result = buildSchedule(params);
      const endTime = performance.now();

      expect(result.rows.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
