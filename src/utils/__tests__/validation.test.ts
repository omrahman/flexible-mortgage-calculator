import {
  validatePrincipal,
  validateRate,
  validateTermYears,
  validateExtraItem,
} from '../validation';
import type { ExtraItem } from '../../types';

describe('validation.ts', () => {
  describe('validatePrincipal()', () => {
    it('should return valid for a reasonable principal amount', () => {
      const { isValid, errors } = validatePrincipal(100000);
      expect(isValid).toBe(true);
      expect(errors.length).toBe(0);
    });

    it('should return an error for a zero or negative principal', () => {
      const { isValid, errors } = validatePrincipal(0);
      expect(isValid).toBe(false);
      expect(errors).toContain('Principal amount must be greater than 0');
    });
  });

  describe('validateRate()', () => {
    it('should return valid for a reasonable interest rate', () => {
      const { isValid, errors } = validateRate(5.5);
      expect(isValid).toBe(true);
      expect(errors.length).toBe(0);
    });

    it('should return an error for a negative interest rate', () => {
      const { isValid, errors } = validateRate(-1);
      expect(isValid).toBe(false);
      expect(errors).toContain('Interest rate cannot be negative');
    });
  });

  describe('validateTermYears()', () => {
    it('should return valid for a reasonable loan term', () => {
      const { isValid, errors } = validateTermYears(30);
      expect(isValid).toBe(true);
      expect(errors.length).toBe(0);
    });

    it('should return an error for a zero or negative loan term', () => {
      const { isValid, errors } = validateTermYears(0);
      expect(isValid).toBe(false);
      expect(errors).toContain('Loan term must be greater than 0 years');
    });
  });

  describe('validateExtraItem()', () => {
    const termMonths = 360;
    const baseExtra: ExtraItem = {
      id: 'test-id',
      month: 12,
      amount: 1000,
    };

    it('should return valid for a correct extra payment item', () => {
      const { isValid, errors } = validateExtraItem(baseExtra, termMonths);
      expect(isValid).toBe(true);
      expect(errors.length).toBe(0);
    });

    it('should return an error for an invalid month', () => {
      const { isValid, errors } = validateExtraItem({ ...baseExtra, month: 0 }, termMonths);
      expect(isValid).toBe(false);
      expect(errors).toContain('Month must be between 1 and 360');
    });

    it('should return an error for a negative amount', () => {
      const { isValid, errors } = validateExtraItem({ ...baseExtra, amount: -100 }, termMonths);
      expect(isValid).toBe(false);
      expect(errors).toContain('Amount must be a non-negative number');
    });

    it('should return an error for invalid recurring quantity', () => {
      const extra: ExtraItem = {
        ...baseExtra,
        isRecurring: true,
        recurringQuantity: 0,
        recurringFrequency: 'monthly',
      };
      const { isValid, errors } = validateExtraItem(extra, termMonths);
      expect(isValid).toBe(false);
      expect(errors).toContain('Recurring quantity must be at least 1');
    });
  });
});
