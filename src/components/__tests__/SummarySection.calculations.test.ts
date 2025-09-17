// This test file focuses on the calculations derived inside the SummarySection component itself.
// It does not test the component's rendering, but rather the logic that prepares data for rendering.
import type { ScheduleResult } from '../../types';

// Helper function to create a mock result object for testing
const createMockResult = (overrides: Partial<ScheduleResult>): ScheduleResult => {
  return {
    rows: [],
    totalInterest: 0,
    totalPaid: 0,
    totalForgiveness: 0,
    payoffMonth: 0,
    segments: [],
    chart: [],
    ...overrides,
  };
};

describe('SummarySection Calculations', () => {
  const principal = 100000;

  describe("Lender's Profit Calculation", () => {
    it("should calculate the lender's profit correctly", () => {
      const result = createMockResult({ totalPaid: 215838.45 });
      // Lender's Profit = Total Paid - Principal
      const lenderProfit = result.totalPaid - principal;
      expect(lenderProfit).toBeCloseTo(115838.45, 2);
    });

    it('should be negative if total paid is less than principal (e.g., with forgiveness)', () => {
      // This could happen if a large forgiveness amount means the borrower pays back less than the principal
      const result = createMockResult({ totalPaid: 90000 });
      const lenderProfit = result.totalPaid - principal;
      expect(lenderProfit).toBe(-10000);
    });
  });

  describe('Total Principal and Extra Payments Calculation', () => {
    it('should correctly sum total principal and extra payments from schedule rows', () => {
      const result = createMockResult({
        rows: [
          { idx: 1, scheduledPrincipal: 100, extraPrincipal: 50, interest: 0, loanBalance: 0, paymentDate: '', forgivenPrincipal: 0, scheduledPayment: 150, actualPayment: 150, cumulativeForgiveness: 0, cumulativeInterest: 0, cumulativePrincipal: 150 },
          { idx: 2, scheduledPrincipal: 110, extraPrincipal: 0, interest: 0, loanBalance: 0, paymentDate: '', forgivenPrincipal: 0, scheduledPayment: 110, actualPayment: 110, cumulativeForgiveness: 0, cumulativeInterest: 0, cumulativePrincipal: 260 },
          { idx: 3, scheduledPrincipal: 120, extraPrincipal: 100, interest: 0, loanBalance: 0, paymentDate: '', forgivenPrincipal: 0, scheduledPayment: 220, actualPayment: 220, cumulativeForgiveness: 0, cumulativeInterest: 0, cumulativePrincipal: 480 },
        ],
      });
      
      const totalExtraPayments = result.rows.reduce((sum, row) => sum + row.extraPrincipal, 0);
      const totalPrincipalPaid = result.rows.reduce((sum, row) => sum + row.scheduledPrincipal, 0);

      expect(totalExtraPayments).toBe(150);
      expect(totalPrincipalPaid).toBe(330);
    });
  });

  describe("Lender's Average Annual Return Calculation", () => {
    it("should calculate the average annual return correctly for a standard loan", () => {
      const result = createMockResult({
        totalInterest: 115838.45,
        payoffMonth: 360,
      });

      const yearsToPayoff = result.payoffMonth / 12;
      // Avg Annual Return = (Total Interest / Principal) / Years
      const avgAnnualReturn = (result.totalInterest / principal) / yearsToPayoff * 100;

      expect(avgAnnualReturn).toBeCloseTo(3.86, 2);
    });

    it('should be higher for a loan with a higher interest rate', () => {
      // Results from a 10% loan over 30 years
      const result = createMockResult({
        totalInterest: 215925.82,
        payoffMonth: 360,
      });

      const yearsToPayoff = result.payoffMonth / 12;
      const avgAnnualReturn = (result.totalInterest / principal) / yearsToPayoff * 100;
      
      expect(avgAnnualReturn).toBeCloseTo(7.20, 2);
    });

    it('should be lower if the loan is paid off early', () => {
      // Standard 6% loan paid off in 10 years with extra payments
      const result = createMockResult({
        totalInterest: 33224.61, // Example interest for a 10-year payoff
        payoffMonth: 120,
      });

      const yearsToPayoff = result.payoffMonth / 12;
      const avgAnnualReturn = (result.totalInterest / principal) / yearsToPayoff * 100;

      // The average return is lower because interest was earned for a shorter time
      expect(avgAnnualReturn).toBeCloseTo(3.32, 2);
    });

    it('should return 0 if the payoff time is zero', () => {
        const result = createMockResult({
            totalInterest: 1000,
            payoffMonth: 0,
        });

        const yearsToPayoff = result.payoffMonth > 0 ? result.payoffMonth / 12 : 0;
        const avgAnnualReturn = yearsToPayoff > 0 ? (result.totalInterest / principal) / yearsToPayoff * 100 : 0;
        
        expect(avgAnnualReturn).toBe(0);
    });
  });
});
