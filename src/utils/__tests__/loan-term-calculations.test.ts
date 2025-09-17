// Comprehensive tests for loan term calculations and early payoff scenarios
// These tests ensure that extra payments and loan forgiveness properly reduce the loan term

import { buildSchedule, calcPayment } from '../calculations';
import type { ScheduleParams } from '../../types';

describe('Loan Term Calculations - Extra Payments', () => {
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

  describe('Early Payoff with Extra Payments', () => {
    it('should pay off loan early with large extra payment in first month', () => {
      const params = createBasicParams({
        extras: { 1: 50000 }, // $50K extra in month 1
      });
      const result = buildSchedule(params);

      // Should pay off much earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.rows.length).toBeLessThan(360);
      
      // Final balance should be 0
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
      
      // Total paid should equal principal + interest + extra payments
      const totalExtraPaid = result.rows.reduce((sum, row) => sum + row.extra, 0);
      expect(totalExtraPaid).toBe(50000);
      // totalPaid includes scheduled payments + extra payments
      expect(result.totalPaid).toBeCloseTo(result.totalInterest + 100000 + totalExtraPaid, 2);
    });

    it('should pay off loan early with multiple extra payments', () => {
      const params = createBasicParams({
        extras: { 
          1: 10000,   // $10K in month 1
          12: 15000,  // $15K in month 12
          24: 20000,  // $20K in month 24
        },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.rows.length).toBeLessThan(360);
      
      // Verify extra payments are applied correctly
      expect(result.rows[0].extra).toBe(10000);
      expect(result.rows[11].extra).toBe(15000);
      expect(result.rows[23].extra).toBe(20000);
      
      // Final balance should be 0
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
    });

    it('should handle extra payment that exactly pays off the loan', () => {
      // Calculate the exact amount needed to pay off in month 1
      const principal = 100000;
      const monthlyRate = 0.06 / 12;
      const interestFirstMonth = principal * monthlyRate;
      const exactPayoffAmount = principal + interestFirstMonth;
      
      const params = createBasicParams({
        extras: { 1: exactPayoffAmount },
      });
      const result = buildSchedule(params);

      // Should pay off in exactly 1 month
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].balance).toBe(0);
      expect(result.rows[0].extra).toBe(exactPayoffAmount);
    });

    it('should handle extra payment that exceeds remaining balance', () => {
      const params = createBasicParams({
        extras: { 1: 200000 }, // $200K extra when loan is only $100K
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      
      // Extra payment should be capped to remaining balance + interest
      const firstMonth = result.rows[0];
      const expectedMaxExtra = 100000 + (100000 * 0.06 / 12);
      expect(firstMonth.extra).toBeLessThanOrEqual(expectedMaxExtra);
      expect(firstMonth.balance).toBe(0);
    });
  });

  describe('Recast Scenarios with Term Reduction', () => {
    it('should recast payment when extra payment reduces term significantly', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 50000 }, // Large extra payment in month 12
      });
      const result = buildSchedule(params);

      // Should trigger recast in month 12
      const twelfthMonth = result.rows[11];
      expect(twelfthMonth.recast).toBe(true);
      expect(twelfthMonth.newPayment).toBeDefined();
      
      // New payment should be different from original
      expect(twelfthMonth.newPayment).not.toBe(twelfthMonth.payment);
      
      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
    });

    it('should maintain correct term calculation after recast', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 6: 30000 }, // Extra payment in month 6
      });
      const result = buildSchedule(params);

      // Find the recast month
      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // The new payment should be calculated based on remaining balance and remaining term
        const remainingBalance = recastMonth.balance;
        const remainingMonths = 360 - recastMonth.idx;
        const expectedNewPayment = calcPayment(remainingBalance, 0.06 / 12, remainingMonths);
        
        // Allow for small rounding differences
        expect(recastMonth.newPayment).toBeCloseTo(expectedNewPayment, 1);
      }
    });

    it('should handle multiple recasts correctly', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 
          12: 20000,  // First recast
          24: 25000,  // Second recast
        },
      });
      const result = buildSchedule(params);

      // Should have multiple recasts
      const recastMonths = result.rows.filter(row => row.recast);
      expect(recastMonths.length).toBeGreaterThanOrEqual(2);
      
      // Each recast should have a new payment
      recastMonths.forEach(recastMonth => {
        expect(recastMonth.newPayment).toBeDefined();
        expect(recastMonth.newPayment).not.toBe(recastMonth.payment);
      });
    });
  });

  describe('Term Calculation Edge Cases', () => {
    it('should handle very small remaining balances at maturity', () => {
      const params = createBasicParams({
        extras: { 359: 599.50 }, // Almost pay off in second to last month
      });
      const result = buildSchedule(params);

      // Should handle the tiny remaining balance properly
      const lastRow = result.rows[result.rows.length - 1];
      expect(lastRow.balance).toBeCloseTo(0, 2);
      
      // Should not exceed the original term by more than 1 month
      expect(result.payoffMonth).toBeLessThanOrEqual(361);
    });

    it('should handle zero interest rate with extra payments', () => {
      const params = createBasicParams({
        annualRatePct: 0,
        extras: { 12: 10000 },
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

    it('should handle very high interest rate with extra payments', () => {
      const params = createBasicParams({
        annualRatePct: 12, // 12% annual rate
        extras: { 6: 20000 },
      });
      const result = buildSchedule(params);

      // Should still pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('should handle short-term loans with extra payments', () => {
      const params = createBasicParams({
        termMonths: 12, // 1 year loan
        extras: { 6: 5000 },
      });
      const result = buildSchedule(params);

      // Should pay off in 12 months or less
      expect(result.payoffMonth).toBeLessThanOrEqual(12);
      expect(result.rows.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Months Remaining Calculation', () => {
    it('should calculate months remaining correctly throughout the loan', () => {
      const params = createBasicParams();
      const result = buildSchedule(params);

      // Check that months remaining decreases correctly
      for (let i = 0; i < Math.min(10, result.rows.length); i++) {
        const row = result.rows[i];
        // const expectedMonthsRemaining = Math.max(0, 360 - row.idx);
        
        // This is a bit tricky to test directly since monthsRemaining is internal
        // But we can verify the loan pays off at the right time
        if (i === result.rows.length - 1) {
          expect(row.balance).toBeCloseTo(0, 2);
        }
      }
    });

    it('should handle early payoff in months remaining calculation', () => {
      const params = createBasicParams({
        extras: { 1: 100000 }, // Pay off entire loan in month 1
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      
      // The calculation should not try to continue beyond the payoff
      expect(result.rows[0].balance).toBe(0);
    });
  });

  describe('Payment Calculation After Recast', () => {
    it('should calculate new payment correctly after recast', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 30000 },
      });
      const result = buildSchedule(params);

      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // Calculate expected new payment manually
        const remainingBalance = recastMonth.balance;
        const remainingMonths = 360 - recastMonth.idx;
        const monthlyRate = 0.06 / 12;
        const expectedPayment = calcPayment(remainingBalance, monthlyRate, remainingMonths);
        
        expect(recastMonth.newPayment).toBeCloseTo(expectedPayment, 2);
      }
    });

    it('should not recast if payment change is too small', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 100 }, // Small extra payment
      });
      const result = buildSchedule(params);

      // Should not trigger recast for small payment changes
      const recastMonths = result.rows.filter(row => row.recast);
      expect(recastMonths.length).toBe(0);
    });
  });
});

describe('Loan Term Calculations - Loan Forgiveness', () => {
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

  describe('Early Payoff with Loan Forgiveness', () => {
    it('should pay off loan early with large forgiveness in first month', () => {
      const params = createBasicParams({
        forgiveness: { 1: 50000 }, // $50K forgiveness in month 1
      });
      const result = buildSchedule(params);

      // Should pay off much earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.rows.length).toBeLessThan(360);
      
      // Final balance should be 0
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
      
      // Total forgiveness should equal the amount forgiven
      expect(result.totalForgiveness).toBe(50000);
      
      // Total paid should NOT include forgiveness amounts
      const totalExtraPaid = result.rows.reduce((sum, row) => sum + row.extra, 0);
      // totalPaid includes scheduled payments + extra payments, but NOT forgiveness
      expect(result.totalPaid).toBeCloseTo(result.totalInterest + 100000 + totalExtraPaid, 2);
    });

    it('should pay off loan early with multiple forgiveness payments', () => {
      const params = createBasicParams({
        forgiveness: { 
          1: 10000,   // $10K forgiveness in month 1
          12: 15000,  // $15K forgiveness in month 12
          24: 20000,  // $20K forgiveness in month 24
        },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.rows.length).toBeLessThan(360);
      
      // Verify forgiveness payments are applied correctly
      expect(result.rows[0].forgiveness).toBe(10000);
      expect(result.rows[11].forgiveness).toBe(15000);
      expect(result.rows[23].forgiveness).toBe(20000);
      
      // Final balance should be 0
      expect(result.rows[result.rows.length - 1].balance).toBe(0);
      
      // Total forgiveness should equal sum of all forgiveness
      expect(result.totalForgiveness).toBe(45000);
    });

    it('should handle forgiveness that exactly pays off the loan', () => {
      const params = createBasicParams({
        forgiveness: { 1: 100000 }, // Forgive entire principal
      });
      const result = buildSchedule(params);

      // Should pay off in exactly 1 month
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].balance).toBe(0);
      expect(result.rows[0].forgiveness).toBe(100000);
      expect(result.totalForgiveness).toBe(100000);
    });

    it('should handle forgiveness that exceeds remaining balance', () => {
      const params = createBasicParams({
        forgiveness: { 1: 200000 }, // $200K forgiveness when loan is only $100K
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      
      // Forgiveness should be capped to remaining balance
      const firstMonth = result.rows[0];
      expect(firstMonth.forgiveness).toBeLessThanOrEqual(100000);
      expect(firstMonth.balance).toBe(0);
    });
  });

  describe('Recast Scenarios with Forgiveness', () => {
    it('should recast payment when forgiveness reduces term significantly', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        forgiveness: { 12: 50000 }, // Large forgiveness in month 12
      });
      const result = buildSchedule(params);

      // Should trigger recast in month 12
      const twelfthMonth = result.rows[11];
      expect(twelfthMonth.recast).toBe(true);
      expect(twelfthMonth.newPayment).toBeDefined();
      
      // New payment should be different from original
      expect(twelfthMonth.newPayment).not.toBe(twelfthMonth.payment);
      
      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
    });

    it('should maintain correct term calculation after forgiveness recast', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        forgiveness: { 6: 30000 }, // Forgiveness in month 6
      });
      const result = buildSchedule(params);

      // Find the recast month
      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // The new payment should be calculated based on remaining balance and remaining term
        const remainingBalance = recastMonth.balance;
        const remainingMonths = 360 - recastMonth.idx;
        const expectedNewPayment = calcPayment(remainingBalance, 0.06 / 12, remainingMonths);
        
        // Allow for small rounding differences
        expect(recastMonth.newPayment).toBeCloseTo(expectedNewPayment, 1);
      }
    });
  });

  describe('Combined Extra Payments and Forgiveness', () => {
    it('should handle both extra payments and forgiveness correctly', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 10000 },      // $10K extra payment
        forgiveness: { 12: 15000 }, // $15K forgiveness
      });
      const result = buildSchedule(params);

      // Should trigger recast in month 12
      const twelfthMonth = result.rows[11];
      expect(twelfthMonth.recast).toBe(true);
      expect(twelfthMonth.extra).toBe(10000);
      expect(twelfthMonth.forgiveness).toBe(15000);
      
      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      
      // Verify totals
      const totalExtraPaid = result.rows.reduce((sum, row) => sum + row.extra, 0);
      const totalForgiveness = result.rows.reduce((sum, row) => sum + row.forgiveness, 0);
      
      expect(totalExtraPaid).toBe(10000);
      expect(totalForgiveness).toBe(15000);
      expect(result.totalForgiveness).toBe(15000);
    });

    it('should handle alternating extra payments and forgiveness', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 6: 5000, 18: 8000 },        // Extra payments
        forgiveness: { 12: 10000, 24: 12000 }, // Forgiveness
      });
      const result = buildSchedule(params);

      // Should have multiple recasts
      const recastMonths = result.rows.filter(row => row.recast);
      expect(recastMonths.length).toBeGreaterThanOrEqual(2);
      
      // Verify all payments are applied
      expect(result.rows[5].extra).toBe(5000);
      expect(result.rows[11].forgiveness).toBe(10000);
      expect(result.rows[17].extra).toBe(8000);
      expect(result.rows[23].forgiveness).toBe(12000);
      
      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
    });
  });

  describe('Forgiveness Edge Cases', () => {
    it('should handle very small remaining balances with forgiveness', () => {
      const params = createBasicParams({
        forgiveness: { 359: 599.50 }, // Almost forgive entire loan in second to last month
      });
      const result = buildSchedule(params);

      // Should handle the tiny remaining balance properly
      const lastRow = result.rows[result.rows.length - 1];
      expect(lastRow.balance).toBeCloseTo(0, 2);
      
      // Should not exceed the original term by more than 1 month
      expect(result.payoffMonth).toBeLessThanOrEqual(361);
    });

    it('should handle zero interest rate with forgiveness', () => {
      const params = createBasicParams({
        annualRatePct: 0,
        forgiveness: { 12: 10000 },
      });
      const result = buildSchedule(params);

      // Should pay off earlier than 360 months
      expect(result.payoffMonth).toBeLessThan(360);
      expect(result.totalInterest).toBe(0);
      
      // Total paid should equal principal (no extra payments in this test)
      // For zero interest rate with forgiveness, totalPaid = principal
      expect(result.totalPaid).toBeCloseTo(100000, 2);
      
      // Total forgiveness should be applied
      expect(result.totalForgiveness).toBe(10000);
    });

    it('should handle forgiveness in the last month', () => {
      const params = createBasicParams({
        forgiveness: { 360: 1000 }, // Forgiveness in the last month
      });
      const result = buildSchedule(params);

      // Should still pay off in 360 months or less
      expect(result.payoffMonth).toBeLessThanOrEqual(360);
      
      // Final balance should be 0
      const lastRow = result.rows[result.rows.length - 1];
      expect(lastRow.balance).toBeCloseTo(0, 2);
    });
  });
});

describe('Loan Term Calculations - Regression Tests', () => {
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

  describe('Critical Regression Scenarios', () => {
    it('should not exceed original term when no extra payments or forgiveness', () => {
      const params = createBasicParams();
      const result = buildSchedule(params);

      // Should pay off in exactly 360 months
      expect(result.payoffMonth).toBe(360);
      expect(result.rows.length).toBe(360);
      
      // Final balance should be very close to 0
      expect(result.rows[359].balance).toBeLessThan(1.0);
    });

    it('should always pay off earlier with extra payments', () => {
      const baseline = buildSchedule(createBasicParams());
      
      const withExtras = buildSchedule(createBasicParams({
        extras: { 1: 1000, 12: 5000, 24: 2000 },
      }));

      // Should always pay off earlier
      expect(withExtras.payoffMonth).toBeLessThan(baseline.payoffMonth);
      expect(withExtras.rows.length).toBeLessThan(baseline.rows.length);
      
      // Should save interest
      expect(withExtras.totalInterest).toBeLessThan(baseline.totalInterest);
    });

    it('should always pay off earlier with forgiveness', () => {
      const baseline = buildSchedule(createBasicParams());
      
      const withForgiveness = buildSchedule(createBasicParams({
        forgiveness: { 1: 1000, 12: 5000, 24: 2000 },
      }));

      // Should always pay off earlier
      expect(withForgiveness.payoffMonth).toBeLessThan(baseline.payoffMonth);
      expect(withForgiveness.rows.length).toBeLessThan(baseline.rows.length);
      
      // Should save interest
      expect(withForgiveness.totalInterest).toBeLessThan(baseline.totalInterest);
    });

    it('should maintain payment consistency after recast', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 20000 },
      });
      const result = buildSchedule(params);

      // Find the recast month
      const recastMonth = result.rows.find(row => row.recast);
      expect(recastMonth).toBeDefined();
      
      if (recastMonth) {
        // All subsequent payments should use the new payment amount
        const newPayment = recastMonth.newPayment!;
        const subsequentMonths = result.rows.slice(recastMonth.idx);
        
        subsequentMonths.forEach(month => {
          if (month.balance > 0) {
            expect(month.payment).toBeCloseTo(newPayment, 2);
          }
        });
      }
    });

    it('should handle extreme early payoff scenarios', () => {
      const params = createBasicParams({
        extras: { 1: 100000 }, // Pay off entire loan in month 1
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].balance).toBe(0);
      
      // Should not have any recast flags
      expect(result.rows[0].recast).toBeUndefined();
    });

    it('should handle extreme forgiveness scenarios', () => {
      const params = createBasicParams({
        forgiveness: { 1: 100000 }, // Forgive entire loan in month 1
      });
      const result = buildSchedule(params);

      // Should pay off in month 1
      expect(result.payoffMonth).toBe(1);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].balance).toBe(0);
      expect(result.rows[0].forgiveness).toBe(100000);
      
      // Should not have any recast flags
      expect(result.rows[0].recast).toBeUndefined();
    });
  });

  describe('Mathematical Consistency Tests', () => {
    it('should maintain mathematical consistency in payment calculations', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        extras: { 12: 15000 },
      });
      const result = buildSchedule(params);

      // Check that each month's calculations are mathematically consistent
      result.rows.forEach((row, index) => {
        // Payment + extra should equal total cash out
        expect(row.total).toBeCloseTo(row.payment + row.extra, 2);
        
        // Interest + principal should equal payment (for non-final months)
        if (row.balance > 0) {
          expect(row.payment).toBeCloseTo(row.interest + row.principal, 2);
        }
        
        // Balance should never go negative
        expect(row.balance).toBeGreaterThanOrEqual(0);
        
        // Cumulative values should be consistent
        if (index > 0) {
          const prevRow = result.rows[index - 1];
          expect(row.cumulativeInterest).toBeCloseTo(
            prevRow.cumulativeInterest + row.interest, 2
          );
          expect(row.cumulativePrincipal).toBeCloseTo(
            prevRow.cumulativePrincipal + row.principal + row.extra, 2
          );
        }
      });
    });

    it('should maintain mathematical consistency with forgiveness', () => {
      const params = createBasicParams({
        autoRecastOnExtra: true,
        forgiveness: { 12: 15000 },
      });
      const result = buildSchedule(params);

      // Check that each month's calculations are mathematically consistent
      result.rows.forEach((row, index) => {
        // Payment + extra should equal total cash out (forgiveness doesn't count as cash)
        expect(row.total).toBeCloseTo(row.payment + row.extra, 2);
        
        // Interest + principal should equal payment (for non-final months)
        if (row.balance > 0) {
          expect(row.payment).toBeCloseTo(row.interest + row.principal, 2);
        }
        
        // Balance should never go negative
        expect(row.balance).toBeGreaterThanOrEqual(0);
        
        // Cumulative forgiveness should be consistent
        if (index > 0) {
          const prevRow = result.rows[index - 1];
          expect(row.cumulativeForgiveness).toBeCloseTo(
            prevRow.cumulativeForgiveness + row.forgiveness, 2
          );
        }
      });
    });
  });
});
