import { fmtUSD, round2 } from '../formatters';

describe('fmtUSD', () => {
  it('should format positive numbers correctly', () => {
    expect(fmtUSD(1000)).toBe('$1,000.00');
    expect(fmtUSD(1234.56)).toBe('$1,234.56');
    expect(fmtUSD(0)).toBe('$0.00');
    expect(fmtUSD(0.01)).toBe('$0.01');
  });

  it('should format negative numbers correctly', () => {
    expect(fmtUSD(-1000)).toBe('-$1,000.00');
    expect(fmtUSD(-1234.56)).toBe('-$1,234.56');
  });

  it('should handle large numbers with proper comma separation', () => {
    expect(fmtUSD(1000000)).toBe('$1,000,000.00');
    expect(fmtUSD(1234567.89)).toBe('$1,234,567.89');
  });

  it('should handle very small numbers', () => {
    expect(fmtUSD(0.001)).toBe('$0.00');
    expect(fmtUSD(0.005)).toBe('$0.01');
  });

  it('should handle non-finite numbers', () => {
    expect(fmtUSD(NaN)).toBe('$0.00');
    expect(fmtUSD(Infinity)).toBe('$0.00');
    expect(fmtUSD(-Infinity)).toBe('$0.00');
  });

  it('should handle very large numbers', () => {
    expect(fmtUSD(999999999.99)).toBe('$999,999,999.99');
  });
});

describe('round2', () => {
  it('should round to 2 decimal places correctly', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
    expect(round2(1.236)).toBe(1.24);
  });

  it('should handle numbers with more than 2 decimal places', () => {
    expect(round2(1.234567)).toBe(1.23);
    expect(round2(1.235567)).toBe(1.24);
    expect(round2(1.999999)).toBe(2.00);
  });

  it('should handle numbers with exactly 2 decimal places', () => {
    expect(round2(1.23)).toBe(1.23);
    expect(round2(1.24)).toBe(1.24);
  });

  it('should handle numbers with fewer than 2 decimal places', () => {
    expect(round2(1.2)).toBe(1.2);
    expect(round2(1)).toBe(1);
    expect(round2(0)).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(round2(-1.234)).toBe(-1.23);
    expect(round2(-1.235)).toBe(-1.24);
    expect(round2(-1.236)).toBe(-1.24);
  });

  it('should handle very small numbers', () => {
    expect(round2(0.001)).toBe(0.00);
    expect(round2(0.005)).toBe(0.01);
    expect(round2(0.004)).toBe(0.00);
  });

  it('should handle very large numbers', () => {
    expect(round2(1234567.89)).toBe(1234567.89);
    expect(round2(1234567.891)).toBe(1234567.89);
    expect(round2(1234567.895)).toBe(1234567.90);
  });

  it('should handle edge cases', () => {
    expect(round2(0.5)).toBe(0.5);
    expect(round2(0.50)).toBe(0.5);
    expect(round2(0.500)).toBe(0.5);
  });

  it('should handle JavaScript floating point precision issues', () => {
    // Common floating point precision issue
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(0.3 - 0.1)).toBe(0.2);
  });
});
