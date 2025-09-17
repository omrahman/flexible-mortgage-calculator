import { round2, fmtUSD } from '../formatters';

describe('formatters.ts', () => {
  describe('round2()', () => {
    it('should round a number to two decimal places', () => {
      expect(round2(123.456)).toBe(123.46);
      expect(round2(123.454)).toBe(123.45);
    });

    it('should handle integers correctly', () => {
      expect(round2(123)).toBe(123.0);
    });

    it('should handle numbers with fewer than two decimal places', () => {
      expect(round2(123.4)).toBe(123.4);
    });

    it('should handle zero and negative numbers', () => {
      expect(round2(0)).toBe(0.0);
      expect(round2(-123.456)).toBe(-123.46);
    });
  });

  describe('fmtUSD()', () => {
    it('should format a positive number as a USD string', () => {
      expect(fmtUSD(1234.56)).toBe('$1,234.56');
    });

    it('should format an integer as a USD string', () => {
      expect(fmtUSD(1234)).toBe('$1,234.00');
    });

    it('should format a negative number as a USD string with parentheses', () => {
      expect(fmtUSD(-1234.56)).toBe('($1,234.56)');
    });

    it('should handle zero correctly', () => {
      expect(fmtUSD(0)).toBe('$0.00');
    });

    it('should handle large numbers with multiple commas', () => {
      expect(fmtUSD(1234567.89)).toBe('$1,234,567.89');
    });
  });
});
