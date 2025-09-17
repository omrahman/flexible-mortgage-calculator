// Edge case tests for loan term calculations
// These tests focus on specific edge cases and potential calculation errors

import { buildSchedule, calcPayment } from '../calculations';
import type { ScheduleParams } from '../../types';

describe('Term Calculation Edge Cases', () => {
  const createBasicParams = (overrides: Partial<ScheduleParams> = {}): ScheduleParams => ({
    principal: 100000,
    annualRatePct: 6,
    termMonths: 360,
    startYM: '2024-01',
    extras: {},
    forgiveness: {},
    recastMonths: new Set(),
    autoRecastOnExtra: false,
    ...overrides,
  });

  describe('Months Remaining Calculation', () => {
    it('should calculate months remaining correctly at each step', () => {
      const params = createBasicParams();
      const result = buildSchedule(params);

      // Test that the internal months remaining calculation works correctly
      // by verifying that the loan pays off at the expected time
      expect(result.payoffMonth).toBe(360);
      expect(result.rows.length).toBe(360);
      
      // The last row should have a very small balance
      const lastRow = result.rows[result.rows.length - 1];
      expect(lastRow.balance).toBeLessThan(1.0);
    });

    it('should handle months remaining when loan pays off early', () => {
      const params = createBasicParams({
        extras: { 1: 100000 }, // Pay off entire loan in month 1
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      
      // The calculation should not continue beyond the payoff
      expect(result.rows[0].balance).toBe(0);
    });

    it('should handle months remaining with recast scenarios', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 20000 }, // Large extra payment in month 12
      });
      const result = buildSchedule(params);

      // Find the recast month
      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // The recast should happen in month 12
        expect(recastMonth.idx).toBe(12);
        
        // The new payment should be calculated with the correct remaining months
        const remainingMonths = 360 - 12; // 348 months remaining
        const remainingBalance = recastMonth.balance;
        const expectedNewPayment = calcPayment(remainingBalance, 0.06 / 12, remainingMonths);
        
        expect(recastMonth.newPayment).toBeCloseTo(expectedNewPayment, 2);
      }
    });
  });

  describe('Recast Logic with Term Reduction', () => {
    it('should not recast if remaining months is 0', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 360: 1000 }, // Extra payment in the last month
      });
      const result = buildSchedule(params);

      // Should not trigger recast in the last month
      const lastMonth = result.rows[result.rows.length - 1];
      expect(lastMonth.recast).toBeUndefined();
    });

    it('should not recast if balance is 0', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 1: 100000 }, // Pay off entire loan in month 1
      });
      const result = buildSchedule(params);

      // Should not trigger recast since loan is paid off
      const firstMonth = result.rows[0];
      expect(firstMonth.recast).toBeUndefined();
    });

    it('should recast with correct remaining months calculation', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 24: 30000 }, // Large extra payment in month 24
      });
      const result = buildSchedule(params);

      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // Calculate expected remaining months
        const expectedRemainingMonths = 360 - recastMonth.idx;
        const remainingBalance = recastMonth.balance;
        const monthlyRate = 0.06 / 12;
        const expectedNewPayment = calcPayment(remainingBalance, monthlyRate, expectedRemainingMonths);
        
        expect(recastMonth.newPayment).toBeCloseTo(expectedNewPayment, 2);
      }
    });
  });

  describe('Maturity Handling Edge Cases', () => {
    it('should handle very small balances at maturity correctly', () => {
      const params = createBasicParams({
        extras: { 359: 599.50 }, // Almost pay off in second to last month
      });
      const result = buildSchedule(params);

      // Should handle the tiny remaining balance
      const lastRow = result.rows[result.rows.length - 1];
      expect(lastRow.balance).toBeCloseTo(0, 2);
      
      // Should not exceed the original term by more than 1 month
      expect(result.payoffMonth).toBeLessThanOrEqual(361);
    });

    it('should handle exact payoff at maturity', () => {
      // Calculate the exact amount needed to pay off in month 360
      // const principal = 100000;
      const monthlyRate = 0.06 / 12;
      
      // Simulate the loan up to month 359
      const tempParams = createBasicParams();
      const tempResult = buildSchedule(tempParams);
      const month359 = tempResult.rows[358]; // 0-indexed
      const remainingBalance = month359.balance;
      const interest360 = remainingBalance * monthlyRate;
      const exactPayoffAmount = remainingBalance + interest360;
      
      const params = createBasicParams({
        extras: { 360: exactPayoffAmount },
      });
      const result = buildSchedule(params);

      // Should pay off in exactly 360 months
      expect(result.payoffMonth).toBe(360);
      expect(result.rows.length).toBe(360);
      expect(result.rows[359].balance).toBe(0);
    });

    it('should handle large extra payment in last month', () => {
      const params = createBasicParams({
        extras: { 360: 10000 }, // Large extra payment in last month
      });
      const result = buildSchedule(params);

      // Should pay off in 360 months
      expect(result.payoffMonth).toBe(360);
      expect(result.rows.length).toBe(360);
      
      // The extra payment should be capped to the remaining balance
      const lastRow = result.rows[359];
      expect(lastRow.extra).toBeGreaterThan(0);
      expect(lastRow.extra).toBeLessThanOrEqual(10000);
      expect(lastRow.balance).toBe(0);
    });
  });

  describe('Payment Difference Threshold', () => {
    it('should not recast for very small payment changes', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 1 }, // Very small extra payment
      });
      const result = buildSchedule(params);

      // Should not trigger recast for tiny payment changes
      const recastMonths = result.rows.filter(row => row.recast);
      expect(recastMonths.length).toBe(0);
    });

    it('should recast for payment changes above threshold', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 1000 }, // Larger extra payment
      });
      const result = buildSchedule(params);

      // Should trigger recast for significant payment changes
      const recastMonths = result.rows.filter(row => row.recast);
      expect(recastMonths.length).toBeGreaterThan(0);
    });
  });

  describe('Balance Calculation Consistency', () => {
    it('should maintain balance consistency throughout the loan', () => {
      const params = createBasicParams({
        extras: { 12: 5000, 24: 10000 },
      });
      const result = buildSchedule(params);

      // Check that balance decreases correctly each month
      for (let i = 1; i < result.rows.length; i++) {
        const currentRow = result.rows[i];
        const prevRow = result.rows[i - 1];
        
        // New balance should equal previous balance minus principal and extra payments
        const expectedBalance = prevRow.balance - currentRow.principal - currentRow.extra - currentRow.forgiveness;
        expect(currentRow.balance).toBeCloseTo(expectedBalance, 2);
      }
    });

    it('should handle balance calculation with forgiveness', () => {
      const params = createBasicParams({
        forgiveness: { 12: 5000, 24: 10000 },
      });
      const result = buildSchedule(params);

      // Check that balance decreases correctly each month
      for (let i = 1; i < result.rows.length; i++) {
        const currentRow = result.rows[i];
        const prevRow = result.rows[i - 1];
        
        // New balance should equal previous balance minus principal, extra, and forgiveness
        const expectedBalance = prevRow.balance - currentRow.principal - currentRow.extra - currentRow.forgiveness;
        expect(currentRow.balance).toBeCloseTo(expectedBalance, 2);
      }
    });

    it('should never allow negative balance', () => {
      const params = createBasicParams({
        extras: { 1: 200000 }, // Extra payment larger than loan
      });
      const result = buildSchedule(params);

      // All balances should be non-negative
      result.rows.forEach(row => {
        expect(row.balance).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Interest Calculation Consistency', () => {
    it('should calculate interest correctly each month', () => {
      const params = createBasicParams({
        extras: { 12: 5000 },
      });
      const result = buildSchedule(params);

      // Check that interest is calculated correctly each month
      // Interest is calculated on the balance at the beginning of the month
      result.rows.forEach((row, index) => {
        if (index === 0) {
          // First month: interest on original balance
          const expectedInterest = 100000 * (0.06 / 12);
          expect(row.interest).toBeCloseTo(expectedInterest, 2);
        } else {
          // Subsequent months: interest on previous month's ending balance
          const prevBalance = result.rows[index - 1].balance;
          const expectedInterest = prevBalance * (0.06 / 12);
          expect(row.interest).toBeCloseTo(expectedInterest, 2);
        }
      });
    });

    it('should handle interest calculation with early payoff', () => {
      const params = createBasicParams({
        extras: { 1: 100000 }, // Pay off entire loan in month 1
      });
      const result = buildSchedule(params);

      // Interest should be calculated on the balance before the payment
      const firstRow = result.rows[0];
      const expectedInterest = 100000 * (0.06 / 12);
      expect(firstRow.interest).toBeCloseTo(expectedInterest, 2);
    });
  });

  describe('Cumulative Values Consistency', () => {
    it('should maintain cumulative interest consistency', () => {
      const params = createBasicParams({
        extras: { 12: 5000 },
      });
      const result = buildSchedule(params);

      // Check that cumulative interest increases correctly
      for (let i = 1; i < result.rows.length; i++) {
        const currentRow = result.rows[i];
        const prevRow = result.rows[i - 1];
        
        const expectedCumulativeInterest = prevRow.cumulativeInterest + currentRow.interest;
        expect(currentRow.cumulativeInterest).toBeCloseTo(expectedCumulativeInterest, 2);
      }
    });

    it('should maintain cumulative principal consistency', () => {
      const params = createBasicParams({
        extras: { 12: 5000 },
      });
      const result = buildSchedule(params);

      // Check that cumulative principal increases correctly
      for (let i = 1; i < result.rows.length; i++) {
        const currentRow = result.rows[i];
        const prevRow = result.rows[i - 1];
        
        const expectedCumulativePrincipal = prevRow.cumulativePrincipal + currentRow.principal + currentRow.extra;
        expect(currentRow.cumulativePrincipal).toBeCloseTo(expectedCumulativePrincipal, 2);
      }
    });

    it('should maintain cumulative forgiveness consistency', () => {
      const params = createBasicParams({
        forgiveness: { 12: 5000 },
      });
      const result = buildSchedule(params);

      // Check that cumulative forgiveness increases correctly
      for (let i = 1; i < result.rows.length; i++) {
        const currentRow = result.rows[i];
        const prevRow = result.rows[i - 1];
        
        const expectedCumulativeForgiveness = prevRow.cumulativeForgiveness + currentRow.forgiveness;
        expect(currentRow.cumulativeForgiveness).toBeCloseTo(expectedCumulativeForgiveness, 2);
      }
    });
  });

  describe('Term Calculation with Different Loan Sizes', () => {
    it('should handle small loans correctly', () => {
      const params = createBasicParams({
        principal: 10000,
        termMonths: 60, // 5 years
        extras: { 12: 2000 },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 60 months
      expect(result.payoffMonth).toBeLessThan(60);
      expect(result.rows.length).toBeLessThan(60);
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
    });

    it('should handle large loans correctly', () => {
      const params = createBasicParams({
        principal: 1000000,
        termMonths: 360,
        extras: { 12: 50000 },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.rows.length).toBeLessThan(360);
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
    });

    it('should handle very short term loans', () => {
      const params = createBasicParams({
        principal: 100000,
        termMonths: 6, // 6 months
        extras: { 3: 20000 },
      });
      const result = buildSchedule(params);

      // Should pay off in 6 months or less
      expect(result.payoffMonth).toBeLessThanOrEqual(6);
      expect(result.rows.length).toBeLessThanOrEqual(6);
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
    });
  });

  describe('Zero and Negative Edge Cases', () => {
    it('should handle zero principal', () => {
      const params = createBasicParams({
        principal: 0,
      });
      const result = buildSchedule(params);

      // Should handle zero principal gracefully
      expect(result.rows.length).toBe(0);
      expect(result.payoffMonth).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalPaid).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const params = createBasicParams({
        annualRatePct: 0,
        extras: { 12: 5000 },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBe(0);
      
      // Total paid should equal principal + extra payments
      const totalExtraPaid = result.rows.reduce((sum, row) => sum + row.extra, 0);
      // For zero interest rate, totalPaid = principal + extra payments
      expect(result.totalPaid).toBeCloseTo(100000 + totalExtraPaid, 2);
    });

    it('should handle very high interest rates', () => {
      const params = createBasicParams({
        annualRatePct: 24, // 24% annual rate
        extras: { 12: 10000 },
      });
      const result = buildSchedule(params);

      // Should still pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBeGreaterThan(0);
    });
  });
});
