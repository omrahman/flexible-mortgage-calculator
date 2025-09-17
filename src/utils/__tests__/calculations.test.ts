import { calcPayment, addMonths, parseMonthInput, buildSchedule } from '../calculations';
import type { ScheduleParams } from '../../types';

describe('calcPayment', () => {
  it('should calculate correct monthly payment for standard loan', () => {
    // Test case: $100,000 loan at 6% annual rate for 30 years
    const principal = 100000;
    const annualRate = 6;
    const termYears = 30;
    const monthlyRate = annualRate / 100 / 12;
    const termMonths = termYears * 12;

    const payment = calcPayment(principal, monthlyRate, termMonths);
    
    // Expected payment should be approximately $599.55
    expect(payment).toBeCloseTo(599.55, 2);
  });

  it('should handle zero interest rate (interest-free loan)', () => {
    const principal = 100000;
    const monthlyRate = 0;
    const termMonths = 360;

    const payment = calcPayment(principal, monthlyRate, termMonths);
    
    // Should be principal divided by months
    expect(payment).toBeCloseTo(277.78, 2);
  });

  it('should handle very small interest rates', () => {
    const principal = 100000;
    const monthlyRate = 1e-15; // Very small rate
    const termMonths = 360;

    const payment = calcPayment(principal, monthlyRate, termMonths);
    
    // Should approximate principal divided by months
    expect(payment).toBeCloseTo(277.78, 2);
  });

  it('should return 0 for zero or negative term months', () => {
    const principal = 100000;
    const monthlyRate = 0.005;

    expect(calcPayment(principal, monthlyRate, 0)).toBe(0);
    expect(calcPayment(principal, monthlyRate, -1)).toBe(0);
  });

  it('should handle high interest rates', () => {
    const principal = 100000;
    const monthlyRate = 0.05; // 5% monthly = 60% annual
    const termMonths = 12;

    const payment = calcPayment(principal, monthlyRate, termMonths);
    
    // Should be a very high payment
    expect(payment).toBeGreaterThan(10000);
    expect(payment).toBeCloseTo(11282.54, 2);
  });

  it('should handle short-term loans', () => {
    const principal = 10000;
    const monthlyRate = 0.01; // 1% monthly
    const termMonths = 6;

    const payment = calcPayment(principal, monthlyRate, termMonths);
    
    expect(payment).toBeCloseTo(1725.48, 2);
  });
});

describe('addMonths', () => {
  it('should add months correctly within the same year', () => {
    expect(addMonths('2024-01', 1)).toBe('2024-02');
    expect(addMonths('2024-05', 3)).toBe('2024-08');
    expect(addMonths('2024-10', 2)).toBe('2024-12');
  });

  it('should handle year transitions', () => {
    expect(addMonths('2024-12', 1)).toBe('2025-01');
    expect(addMonths('2024-11', 2)).toBe('2025-01');
    expect(addMonths('2023-12', 1)).toBe('2024-01');
  });

  it('should handle multiple year transitions', () => {
    expect(addMonths('2024-01', 12)).toBe('2025-01');
    expect(addMonths('2024-01', 24)).toBe('2026-01');
    expect(addMonths('2024-06', 18)).toBe('2025-12');
  });

  it('should handle negative months (subtraction)', () => {
    expect(addMonths('2024-03', -1)).toBe('2024-02');
    expect(addMonths('2024-01', -1)).toBe('2023-12');
    expect(addMonths('2025-01', -12)).toBe('2024-01');
  });

  it('should handle zero months', () => {
    expect(addMonths('2024-06', 0)).toBe('2024-06');
  });

  it('should handle leap years correctly', () => {
    expect(addMonths('2024-02', 1)).toBe('2024-03');
    expect(addMonths('2024-01', 1)).toBe('2024-02');
  });
});

describe('parseMonthInput', () => {
  it('should parse single month numbers', () => {
    expect(parseMonthInput('1')).toEqual([1]);
    expect(parseMonthInput('12')).toEqual([12]);
    expect(parseMonthInput('360')).toEqual([360]);
  });

  it('should parse multiple month numbers', () => {
    expect(parseMonthInput('1, 2, 3')).toEqual([1, 2, 3]);
    expect(parseMonthInput('6,12,24')).toEqual([6, 12, 24]);
    expect(parseMonthInput('1, 5, 10, 15')).toEqual([1, 5, 10, 15]);
  });

  it('should parse month ranges', () => {
    expect(parseMonthInput('1-3')).toEqual([1, 2, 3]);
    expect(parseMonthInput('6-8')).toEqual([6, 7, 8]);
    expect(parseMonthInput('12-15')).toEqual([12, 13, 14, 15]);
  });

  it('should parse mixed single months and ranges', () => {
    expect(parseMonthInput('1, 3-5, 8')).toEqual([1, 3, 4, 5, 8]);
    expect(parseMonthInput('6-8, 12, 15-17')).toEqual([6, 7, 8, 12, 15, 16, 17]);
  });

  it('should handle whitespace and various separators', () => {
    expect(parseMonthInput('1,2,3')).toEqual([1, 2, 3]);
    expect(parseMonthInput('1 2 3')).toEqual([1, 2, 3]);
    expect(parseMonthInput('1, 2, 3')).toEqual([1, 2, 3]);
    expect(parseMonthInput('1-3, 5, 7-9')).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it('should remove duplicates and sort results', () => {
    expect(parseMonthInput('1, 1, 2, 2')).toEqual([1, 2]);
    expect(parseMonthInput('3, 1, 2')).toEqual([1, 2, 3]);
    expect(parseMonthInput('5-7, 6, 4')).toEqual([4, 5, 6, 7]);
  });

  it('should filter out invalid values', () => {
    expect(parseMonthInput('0')).toEqual([]);
    expect(parseMonthInput('-1')).toEqual([]);
    expect(parseMonthInput('abc')).toEqual([]);
    expect(parseMonthInput('1, abc, 2')).toEqual([1, 2]);
  });

  it('should handle empty input', () => {
    expect(parseMonthInput('')).toEqual([]);
    expect(parseMonthInput('   ')).toEqual([]);
  });

  it('should handle invalid ranges', () => {
    expect(parseMonthInput('5-3')).toEqual([]); // Invalid range
    expect(parseMonthInput('0-5')).toEqual([]); // Invalid start
    expect(parseMonthInput('1-0')).toEqual([]); // Invalid end
  });
});

describe('buildSchedule', () => {
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

  it('should generate correct basic amortization schedule', () => {
    const params = createBasicParams();
    const result = buildSchedule(params);

    expect(result.rows).toHaveLength(360);
    expect(result.payoffMonth).toBe(360);
    expect(result.totalInterest).toBeCloseTo(115838.45, 2);
    expect(result.totalPaid).toBeCloseTo(215838, 2);

    // Check first payment
    const firstPayment = result.rows[0];
    expect(firstPayment.idx).toBe(1);
    expect(firstPayment.date).toBe('2024-01');
    expect(firstPayment.payment).toBeCloseTo(599.55, 2);
    expect(firstPayment.interest).toBeCloseTo(500.00, 2);
    expect(firstPayment.principal).toBeCloseTo(99.55, 2);
    expect(firstPayment.extra).toBe(0);
    expect(firstPayment.total).toBeCloseTo(599.55, 2);
    expect(firstPayment.balance).toBeCloseTo(99900.45, 2);

    // Check last payment
    const lastPayment = result.rows[359];
    expect(lastPayment.idx).toBe(360);
    expect(lastPayment.date).toBe('2053-12');
    expect(lastPayment.balance).toBeLessThan(1.0); // Allow for small rounding errors
  });

  it('should handle extra payments correctly', () => {
    const params = createBasicParams({
      extras: { 1: 1000, 12: 5000 }, // $1000 in month 1, $5000 in month 12
    });
    const result = buildSchedule(params);

    // Check first month with extra payment
    const firstMonth = result.rows[0];
    expect(firstMonth.extra).toBe(1000);
    expect(firstMonth.total).toBeCloseTo(1599.55, 2);
    expect(firstMonth.balance).toBeCloseTo(98900.45, 2);

    // Check 12th month with extra payment
    const twelfthMonth = result.rows[11];
    expect(twelfthMonth.extra).toBe(5000);
    expect(twelfthMonth.total).toBeCloseTo(5599.55, 2);

    // Should pay off early
    expect(result.payoffMonth).toBeLessThan(360);
    expect(result.totalInterest).toBeLessThan(115838.07);
  });

  it('should handle recast functionality', () => {
    const params = createBasicParams({
      recastMonths: new Set([12, 24]), // Recast at months 12 and 24
      extras: { 12: 10000, 24: 15000 }, // Extra payments to trigger recasts
    });
    const result = buildSchedule(params);

    // Check that recast flags are set
    const twelfthMonth = result.rows[11];
    expect(twelfthMonth.recast).toBe(true);
    expect(twelfthMonth.newPayment).toBeDefined();
    expect(twelfthMonth.newPayment).not.toBe(twelfthMonth.payment);

    const twentyFourthMonth = result.rows[23];
    expect(twentyFourthMonth.recast).toBe(true);
    expect(twentyFourthMonth.newPayment).toBeDefined();
  });

  it('should handle auto-recast on extra payments', () => {
    const params = createBasicParams({
      autoRecastOnExtra: true,
      extras: { 6: 5000, 18: 10000 }, // Extra payments should trigger recasts
    });
    const result = buildSchedule(params);

    // Check that recasts were triggered by extra payments
    const sixthMonth = result.rows[5];
    expect(sixthMonth.recast).toBe(true);
    expect(sixthMonth.newPayment).toBeDefined();

    const eighteenthMonth = result.rows[17];
    expect(eighteenthMonth.recast).toBe(true);
    expect(eighteenthMonth.newPayment).toBeDefined();
  });

  it('should handle very large extra payments that pay off the loan', () => {
    const params = createBasicParams({
      extras: { 1: 100000 }, // Pay off entire loan in first month
    });
    const result = buildSchedule(params);

    expect(result.rows).toHaveLength(1);
    expect(result.payoffMonth).toBe(1);
    expect(result.rows[0].balance).toBe(0);
    expect(result.rows[0].extra).toBe(100000);
  });

  it('should handle zero interest rate', () => {
    // Essentially boils down to $100k / 360 months = $277.78
    const params = createBasicParams({
      annualRatePct: 0,
    });
    const result = buildSchedule(params);

    expect(result.rows).toHaveLength(360);
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBeCloseTo(100000, 2);

    // All payments should be principal only except last payment
    result.rows.slice(0, -1).forEach(row => {
      expect(row.interest).toBe(0);
      expect(row.principal).toBeCloseTo(277.78, 2);
    });

    const lastRow = result.rows[result.rows.length - 1];
    expect(lastRow.interest).toBe(0);
    expect(lastRow.principal).toBeCloseTo(276.98, 2); // Slightly different due to rounding
  });

  it('should handle very short term loans', () => {
    const params = createBasicParams({
      principal: 100000,
      annualRatePct: 5,
      termMonths: 12, // 1 year loan
    });
    const result = buildSchedule(params);

    expect(result.rows).toHaveLength(12);
    expect(result.payoffMonth).toBe(12);
    expect(result.rows[11].balance).toBeCloseTo(0, 2);
  });

  it('should handle edge case where extra payment exceeds remaining balance', () => {
    const params = createBasicParams({
      extras: { 360: 1000 }, // Extra payment in last month
    });
    const result = buildSchedule(params);

    const lastMonth = result.rows[359];
    // Extra payment should be capped appropriately
    expect(lastMonth.extra).toBeGreaterThan(0);
    expect(lastMonth.extra).toBeLessThanOrEqual(1000); // Should not exceed the requested amount
  });

  it('should generate correct chart data', () => {
    const params = createBasicParams();
    const result = buildSchedule(params);

    expect(result.chart).toHaveLength(360);
    expect(result.chart[0].name).toBe('1\n2024-01');
    expect(result.chart[0].balance).toBeCloseTo(99900.45, 2);
    expect(result.chart[359].balance).toBeLessThan(1.0); // Allow for small rounding errors
  });

  it('should handle payment segments correctly', () => {
    const params = createBasicParams({
      recastMonths: new Set([12]),
      extras: { 12: 10000 },
    });
    const result = buildSchedule(params);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].start).toBe(1);
    expect(result.segments[1].start).toBe(13);
    expect(result.segments[0].payment).not.toBe(result.segments[1].payment);
  });

  it('should handle very small balances at maturity', () => {
    const params = createBasicParams({
      extras: { 359: 599.50 }, // Almost pay off in second to last month
    });
    const result = buildSchedule(params);

    // Should handle the tiny remaining balance
    expect(result.rows[result.rows.length - 1].balance).toBeCloseTo(0, 2);
  });
});
