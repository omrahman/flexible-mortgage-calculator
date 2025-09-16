import { 
  validatePrincipal, 
  validateRate, 
  validateTermYears, 
  validateStartDate, 
  validateExtraPayment, 
  validateConfigurationName 
} from '../validation';

describe('validatePrincipal', () => {
  it('should validate correct principal amounts', () => {
    const validAmounts = [1000, 100000, 500000, 1000000];
    
    validAmounts.forEach(amount => {
      const result = validatePrincipal(amount);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid principal amounts', () => {
    const invalidAmounts = [0, -1000, -1];
    
    invalidAmounts.forEach(amount => {
      const result = validatePrincipal(amount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Principal amount must be greater than 0');
    });
  });

  it('should warn about unusually high principal amounts', () => {
    const result = validatePrincipal(15000000);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Principal amount seems unusually high');
  });
});

describe('validateRate', () => {
  it('should validate correct interest rates', () => {
    const validRates = [0, 2.5, 4.5, 6.0, 10, 20, 50];
    
    validRates.forEach(rate => {
      const result = validateRate(rate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid interest rates', () => {
    const invalidRates = [-1, -0.1, 51, 100];
    
    invalidRates.forEach(rate => {
      const result = validateRate(rate);
      expect(result.isValid).toBe(false);
      if (rate < 0) {
        expect(result.errors).toContain('Interest rate cannot be negative');
      } else {
        expect(result.errors).toContain('Interest rate seems unusually high');
      }
    });
  });
});

describe('validateTermYears', () => {
  it('should validate correct term years', () => {
    const validTerms = [1, 15, 30, 50];
    
    validTerms.forEach(term => {
      const result = validateTermYears(term);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid term years', () => {
    const invalidTerms = [0, -1, 51, 100];
    
    invalidTerms.forEach(term => {
      const result = validateTermYears(term);
      expect(result.isValid).toBe(false);
      if (term <= 0) {
        expect(result.errors).toContain('Loan term must be greater than 0 years');
      } else {
        expect(result.errors).toContain('Loan term seems unusually long');
      }
    });
  });
});

describe('validateStartDate', () => {
  beforeEach(() => {
    // Mock current date to 2024-01-01
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should validate correct start dates', () => {
    const validDates = ['2024-01', '2024-06', '2024-12', '2025-01'];
    
    validDates.forEach(date => {
      const result = validateStartDate(date);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid start dates', () => {
    const currentYear = new Date().getFullYear();
    const invalidDates = ['', `${currentYear - 1}-12`, `${currentYear - 1}-01`, `${currentYear + 11}-01`];
    
    invalidDates.forEach(date => {
      const result = validateStartDate(date);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  it('should detect past dates', () => {
    const currentYear = new Date().getFullYear();
    const result = validateStartDate(`${currentYear - 1}-12`);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Start date cannot be in the past');
  });

  it('should detect dates too far in the future', () => {
    const currentYear = new Date().getFullYear();
    const result = validateStartDate(`${currentYear + 11}-01`);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Start date seems too far in the future');
  });

  it('should detect invalid months', () => {
    const invalidMonths = ['2024-00', '2024-13', '2024-15'];
    
    invalidMonths.forEach(date => {
      const result = validateStartDate(date);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid month');
    });
  });

  it('should handle empty start date', () => {
    const result = validateStartDate('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Start date is required');
  });
});

describe('validateExtraPayment', () => {
  it('should validate correct extra payment amounts and months', () => {
    const validCases = [
      { amount: 1000, month: 6 },
      { amount: 5000, month: 12 },
      { amount: 0.01, month: 1 },
      { amount: 100000, month: 360 },
    ];

    validCases.forEach(({ amount, month }) => {
      const result = validateExtraPayment(amount, month);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid extra payment amounts', () => {
    const invalidAmounts = [0, -100, -0.01];

    invalidAmounts.forEach(amount => {
      const result = validateExtraPayment(amount, 6);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Extra payment amount must be greater than 0');
    });
  });

  it('should detect invalid months', () => {
    const invalidMonths = [0, -1, 601, 1000];

    invalidMonths.forEach(month => {
      const result = validateExtraPayment(1000, month);
      expect(result.isValid).toBe(false);
      if (month < 1) {
        expect(result.errors).toContain('Month must be at least 1');
      } else {
        expect(result.errors).toContain('Month seems too far in the future');
      }
    });
  });

  it('should handle edge cases for month validation', () => {
    const edgeCases = [
      { month: 1, shouldBeValid: true },
      { month: 600, shouldBeValid: true },
      { month: 601, shouldBeValid: false },
      { month: 0, shouldBeValid: false },
    ];

    edgeCases.forEach(({ month, shouldBeValid }) => {
      const result = validateExtraPayment(1000, month);
      expect(result.isValid).toBe(shouldBeValid);
    });
  });

  it('should handle edge cases for amount validation', () => {
    const edgeCases = [
      { amount: 0.01, shouldBeValid: true },
      { amount: 1000000, shouldBeValid: true },
      { amount: 0, shouldBeValid: false },
      { amount: -0.01, shouldBeValid: false },
    ];

    edgeCases.forEach(({ amount, shouldBeValid }) => {
      const result = validateExtraPayment(amount, 6);
      expect(result.isValid).toBe(shouldBeValid);
    });
  });
});

describe('validateConfigurationName', () => {
  it('should validate correct configuration names', () => {
    const validNames = [
      'My Loan',
      'House Purchase',
      'Refinance 2024',
      'Test',
      'A'.repeat(50), // Exactly 50 characters
    ];

    validNames.forEach(name => {
      const result = validateConfigurationName(name);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  it('should detect invalid configuration names', () => {
    const invalidNames = [
      '', // Empty
      ' ', // Only whitespace
      'A', // Too short
      'A'.repeat(51), // Too long
    ];

    invalidNames.forEach(name => {
      const result = validateConfigurationName(name);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  it('should detect empty configuration names', () => {
    const result = validateConfigurationName('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Configuration name is required');
  });

  it('should detect configuration names that are too short', () => {
    const result = validateConfigurationName('A');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Configuration name must be at least 2 characters');
  });

  it('should detect configuration names that are too long', () => {
    const result = validateConfigurationName('A'.repeat(51));
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Configuration name must be less than 50 characters');
  });

  it('should handle whitespace in configuration names', () => {
    const result = validateConfigurationName('  My Loan  ');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle edge cases for length validation', () => {
    const edgeCases = [
      { name: 'AB', shouldBeValid: true }, // Exactly 2 characters
      { name: 'A'.repeat(50), shouldBeValid: true }, // Exactly 50 characters
      { name: 'A', shouldBeValid: false }, // 1 character
      { name: 'A'.repeat(51), shouldBeValid: false }, // 51 characters
    ];

    edgeCases.forEach(({ name, shouldBeValid }) => {
      const result = validateConfigurationName(name);
      expect(result.isValid).toBe(shouldBeValid);
    });
  });
});
