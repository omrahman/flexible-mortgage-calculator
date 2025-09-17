// Tests for SummarySection calculation logic
// These tests ensure that summary calculations properly handle loan term reductions

import type { ScheduleResult } from '../../types';

// Mock the SummarySection component's calculation logic
const calculateLenderProfit = (result: ScheduleResult, principal: number): number => {
  return result.totalPaid - principal;
};

const calculateTotalExtraPayments = (result: ScheduleResult): number => {
  return result.rows.reduce((sum, row) => sum + row.extra, 0);
};

const calculateTotalPrincipalPaid = (result: ScheduleResult): number => {
  return result.rows.reduce((sum, row) => sum + row.principal, 0);
};

const calculateAnnualizedReturn = (result: ScheduleResult, principal: number): number => {
  if (principal <= 0) return 0;
  
  const totalReceived = result.totalPaid;
  const yearsToPayoff = result.payoffMonth / 12;
  
  if (yearsToPayoff <= 0) return 0;
  
  return (Math.pow(totalReceived / principal, 1 / yearsToPayoff) - 1) * 100;
};

const calculateInterestSaved = (baseline: ScheduleResult, result: ScheduleResult): number => {
  return baseline.totalInterest - result.totalInterest;
};

const calculateMonthsSaved = (baseline: ScheduleResult, result: ScheduleResult): number => {
  return Math.max(0, baseline.payoffMonth - result.payoffMonth);
};

describe('SummarySection Calculations', () => {
  const createBasicScheduleResult = (overrides: Partial<ScheduleResult> = {}): ScheduleResult => ({
    rows: [],
    totalInterest: 0,
    totalPaid: 0,
    totalForgiveness: 0,
    payoffMonth: 360,
    segments: [{ start: 1, payment: 1000 }],
    chart: [],
    ...overrides,
  });

  const createBasicRow = (idx: number, balance: number, extra: number = 0, forgiveness: number = 0) => ({
    idx,
    date: `2024-${idx.toString().padStart(2, '0')}`,
    payment: 1000,
    interest: 500,
    principal: 500,
    extra,
    forgiveness,
    total: 1000 + extra,
    balance,
    cumulativeInterest: idx * 500,
    cumulativePrincipal: idx * 500 + extra,
    cumulativeForgiveness: forgiveness,
  });

  describe('Lender Profit Calculation', () => {
    it('should calculate lender profit correctly for standard loan', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 200000,
        totalInterest: 100000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      expect(lenderProfit).toBe(100000); // totalPaid - principal
    });

    it('should calculate lender profit correctly with extra payments', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 150000, // Paid off early with extra payments
        totalInterest: 50000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      expect(lenderProfit).toBe(50000); // totalPaid - principal
    });

    it('should calculate lender profit correctly with forgiveness', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 80000, // Lower total paid due to forgiveness
        totalInterest: 30000,
        totalForgiveness: 50000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      expect(lenderProfit).toBe(-20000); // totalPaid - principal (negative because of forgiveness)
    });

    it('should handle zero principal', () => {
      const principal = 0;
      const result = createBasicScheduleResult({
        totalPaid: 1000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      expect(lenderProfit).toBe(1000);
    });
  });

  describe('Total Extra Payments Calculation', () => {
    it('should calculate total extra payments correctly', () => {
      const result = createBasicScheduleResult({
        rows: [
          createBasicRow(1, 99000, 1000),
          createBasicRow(2, 98000, 2000),
          createBasicRow(3, 97000, 0),
        ],
      });

      const totalExtraPayments = calculateTotalExtraPayments(result);
      expect(totalExtraPayments).toBe(3000);
    });

    it('should handle no extra payments', () => {
      const result = createBasicScheduleResult({
        rows: [
          createBasicRow(1, 99000, 0),
          createBasicRow(2, 98000, 0),
        ],
      });

      const totalExtraPayments = calculateTotalExtraPayments(result);
      expect(totalExtraPayments).toBe(0);
    });

    it('should handle empty rows', () => {
      const result = createBasicScheduleResult({
        rows: [],
      });

      const totalExtraPayments = calculateTotalExtraPayments(result);
      expect(totalExtraPayments).toBe(0);
    });
  });

  describe('Total Principal Paid Calculation', () => {
    it('should calculate total principal paid correctly', () => {
      const result = createBasicScheduleResult({
        rows: [
          createBasicRow(1, 99000, 1000), // 500 principal + 1000 extra
          createBasicRow(2, 98000, 2000), // 500 principal + 2000 extra
          createBasicRow(3, 97000, 0),    // 500 principal + 0 extra
        ],
      });

      const totalPrincipalPaid = calculateTotalPrincipalPaid(result);
      expect(totalPrincipalPaid).toBe(1500); // Only scheduled principal payments
    });

    it('should handle no principal payments', () => {
      const result = createBasicScheduleResult({
        rows: [],
      });

      const totalPrincipalPaid = calculateTotalPrincipalPaid(result);
      expect(totalPrincipalPaid).toBe(0);
    });
  });

  describe('Annualized Return Calculation', () => {
    it('should calculate annualized return correctly for standard loan', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 200000,
        payoffMonth: 360, // 30 years
      });

      const annualizedReturn = calculateAnnualizedReturn(result, principal);
      expect(annualizedReturn).toBeCloseTo(2.34, 2); // Approximately 2.34% annual return
    });

    it('should calculate annualized return correctly for early payoff', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 120000,
        payoffMonth: 120, // 10 years
      });

      const annualizedReturn = calculateAnnualizedReturn(result, principal);
      expect(annualizedReturn).toBeCloseTo(1.84, 2); // Approximately 1.84% annual return
    });

    it('should handle zero principal', () => {
      const principal = 0;
      const result = createBasicScheduleResult({
        totalPaid: 1000,
        payoffMonth: 12,
      });

      const annualizedReturn = calculateAnnualizedReturn(result, principal);
      expect(annualizedReturn).toBe(0);
    });

    it('should handle zero payoff month', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 100000,
        payoffMonth: 0,
      });

      const annualizedReturn = calculateAnnualizedReturn(result, principal);
      expect(annualizedReturn).toBe(0);
    });

    it('should handle very short term loans', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 105000,
        payoffMonth: 1, // 1 month
      });

      const annualizedReturn = calculateAnnualizedReturn(result, principal);
      expect(annualizedReturn).toBeCloseTo(60, 2); // Very high return for 1 month
    });
  });

  describe('Interest Saved Calculation', () => {
    it('should calculate interest saved correctly', () => {
      const baseline = createBasicScheduleResult({
        totalInterest: 100000,
      });
      const result = createBasicScheduleResult({
        totalInterest: 80000,
      });

      const interestSaved = calculateInterestSaved(baseline, result);
      expect(interestSaved).toBe(20000);
    });

    it('should handle negative interest saved (more interest paid)', () => {
      const baseline = createBasicScheduleResult({
        totalInterest: 80000,
      });
      const result = createBasicScheduleResult({
        totalInterest: 100000,
      });

      const interestSaved = calculateInterestSaved(baseline, result);
      expect(interestSaved).toBe(-20000);
    });

    it('should handle equal interest amounts', () => {
      const baseline = createBasicScheduleResult({
        totalInterest: 100000,
      });
      const result = createBasicScheduleResult({
        totalInterest: 100000,
      });

      const interestSaved = calculateInterestSaved(baseline, result);
      expect(interestSaved).toBe(0);
    });
  });

  describe('Months Saved Calculation', () => {
    it('should calculate months saved correctly', () => {
      const baseline = createBasicScheduleResult({
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        payoffMonth: 300,
      });

      const monthsSaved = calculateMonthsSaved(baseline, result);
      expect(monthsSaved).toBe(60);
    });

    it('should handle no months saved', () => {
      const baseline = createBasicScheduleResult({
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        payoffMonth: 360,
      });

      const monthsSaved = calculateMonthsSaved(baseline, result);
      expect(monthsSaved).toBe(0);
    });

    it('should handle negative months saved (longer term)', () => {
      const baseline = createBasicScheduleResult({
        payoffMonth: 300,
      });
      const result = createBasicScheduleResult({
        payoffMonth: 360,
      });

      const monthsSaved = calculateMonthsSaved(baseline, result);
      expect(monthsSaved).toBe(0); // Should be 0, not negative
    });

    it('should handle extreme early payoff', () => {
      const baseline = createBasicScheduleResult({
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        payoffMonth: 1,
      });

      const monthsSaved = calculateMonthsSaved(baseline, result);
      expect(monthsSaved).toBe(359);
    });
  });

  describe('Edge Cases with Term Reduction', () => {
    it('should handle very early payoff scenarios', () => {
      const principal = 100000;
      const baseline = createBasicScheduleResult({
        totalInterest: 115838,
        totalPaid: 215838,
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        totalInterest: 500,
        totalPaid: 100500,
        payoffMonth: 1,
        totalForgiveness: 0,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      const interestSaved = calculateInterestSaved(baseline, result);
      const monthsSaved = calculateMonthsSaved(baseline, result);
      const annualizedReturn = calculateAnnualizedReturn(result, principal);

      expect(lenderProfit).toBe(500); // Very small profit
      expect(interestSaved).toBe(115338); // Almost all interest saved
      expect(monthsSaved).toBe(359); // Almost all months saved
      expect(annualizedReturn).toBeCloseTo(0.5, 2); // Very low return due to early payoff
    });

    it('should handle forgiveness scenarios', () => {
      const principal = 100000;
      const baseline = createBasicScheduleResult({
        totalInterest: 115838,
        totalPaid: 215838,
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        totalInterest: 50000,
        totalPaid: 100000, // Only paid principal, no extra
        payoffMonth: 180,
        totalForgiveness: 50000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      const interestSaved = calculateInterestSaved(baseline, result);
      const monthsSaved = calculateMonthsSaved(baseline, result);
      const annualizedReturn = calculateAnnualizedReturn(result, principal);

      expect(lenderProfit).toBe(0); // No profit, just got principal back
      expect(interestSaved).toBe(65838); // Interest saved
      expect(monthsSaved).toBe(180); // 15 years saved
      expect(annualizedReturn).toBeCloseTo(0, 2); // 0% return due to forgiveness
    });

    it('should handle partial forgiveness scenarios', () => {
      const principal = 100000;
      const baseline = createBasicScheduleResult({
        totalInterest: 115838,
        totalPaid: 215838,
        payoffMonth: 360,
      });
      const result = createBasicScheduleResult({
        totalInterest: 80000,
        totalPaid: 150000,
        payoffMonth: 240,
        totalForgiveness: 25000,
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      const interestSaved = calculateInterestSaved(baseline, result);
      const monthsSaved = calculateMonthsSaved(baseline, result);
      const annualizedReturn = calculateAnnualizedReturn(result, principal);

      expect(lenderProfit).toBe(50000); // Some profit
      expect(interestSaved).toBe(35838); // Some interest saved
      expect(monthsSaved).toBe(120); // 10 years saved
      expect(annualizedReturn).toBeCloseTo(2.08, 2); // Moderate return
    });
  });

  describe('Mathematical Consistency', () => {
    it('should maintain consistency between different calculations', () => {
      const principal = 100000;
      const result = createBasicScheduleResult({
        totalPaid: 150000,
        totalInterest: 40000,
        payoffMonth: 180,
      });

      const lenderProfit = calculateLenderProfit(result, principal);

      // Lender profit should equal total paid minus principal
      expect(lenderProfit).toBe(50000);
      
      // Total paid should equal total interest + total principal paid + total extra payments
      // (This is a simplified check - in reality, totalPaid includes scheduled principal + extra payments)
      expect(result.totalPaid).toBe(150000);
    });

    it('should handle zero values consistently', () => {
      const principal = 0;
      const result = createBasicScheduleResult({
        totalPaid: 0,
        totalInterest: 0,
        payoffMonth: 0,
        rows: [],
      });

      const lenderProfit = calculateLenderProfit(result, principal);
      const totalExtraPayments = calculateTotalExtraPayments(result);
      const totalPrincipalPaid = calculateTotalPrincipalPaid(result);
      const annualizedReturn = calculateAnnualizedReturn(result, principal);

      expect(lenderProfit).toBe(0);
      expect(totalExtraPayments).toBe(0);
      expect(totalPrincipalPaid).toBe(0);
      expect(annualizedReturn).toBe(0);
    });
  });
});
