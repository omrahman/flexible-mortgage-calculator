import { ExtraItem, LoanConfigurationSchema } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePrincipal(principal: number): ValidationResult {
  const errors: string[] = [];
  
  if (principal <= 0) {
    errors.push('Principal amount must be greater than 0');
  }
  
  if (principal > 10000000) {
    errors.push('Principal amount seems unusually high');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRate(rate: number): ValidationResult {
  const errors: string[] = [];
  
  if (rate < 0) {
    errors.push('Interest rate cannot be negative');
  }
  
  if (rate > 50) {
    errors.push('Interest rate seems unusually high');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateTermYears(termYears: number): ValidationResult {
  const errors: string[] = [];
  
  if (termYears <= 0) {
    errors.push('Loan term must be greater than 0 years');
  }
  
  if (termYears > 50) {
    errors.push('Loan term seems unusually long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateStartDate(startYM: string): ValidationResult {
  const errors: string[] = [];
  
  if (!startYM) {
    errors.push('Start date is required');
    return { isValid: false, errors };
  }
  
  const [year, month] = startYM.split('-').map(Number);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push('Start date cannot be in the past');
  }
  
  if (year > currentYear + 10) {
    errors.push('Start date seems too far in the future');
  }
  
  if (month < 1 || month > 12) {
    errors.push('Invalid month');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExtraPayment(amount: number, month: number): ValidationResult {
  const errors: string[] = [];
  
  if (amount <= 0) {
    errors.push('Extra payment amount must be greater than 0');
  }
  
  if (month < 1) {
    errors.push('Month must be at least 1');
  }
  
  if (month > 600) {
    errors.push('Month seems too far in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateConfigurationName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('Configuration name is required');
  }
  
  if (name.trim().length < 2) {
    errors.push('Configuration name must be at least 2 characters');
  }
  
  if (name.trim().length > 50) {
    errors.push('Configuration name must be less than 50 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced validation for ExtraItem with recurrence information
export function validateExtraItem(extra: ExtraItem, termMonths: number): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!extra.id || typeof extra.id !== 'string') {
    errors.push('Extra payment ID is required');
  }
  
  if (!Number.isFinite(extra.month) || extra.month < 1 || extra.month > termMonths) {
    errors.push(`Month must be between 1 and ${termMonths}`);
  }
  
  if (!Number.isFinite(extra.amount) || extra.amount < 0) {
    errors.push('Amount must be a non-negative number');
  }
  
  
  // Recurring payment validation
  if (extra.isRecurring) {
    if (!Number.isFinite(extra.recurringQuantity) || (extra.recurringQuantity && extra.recurringQuantity < 1)) {
      errors.push('Recurring quantity must be at least 1');
    }
    
    if (!extra.recurringFrequency || !['monthly', 'annually'].includes(extra.recurringFrequency)) {
      errors.push('Recurring frequency must be monthly or annually');
    }
    
    if (extra.recurringEndMonth && (extra.recurringEndMonth < extra.month || extra.recurringEndMonth > termMonths)) {
      errors.push('Recurring end month must be after start month and within loan term');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validation for loan configuration schema
export function validateLoanConfigurationSchema(data: LoanConfigurationSchema): ValidationResult {
  const errors: string[] = [];
  
  // Check required top-level fields
  if (!data.version || typeof data.version !== 'string') {
    errors.push('Schema version is required');
  }
  
  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('Metadata is required');
  } else {
    if (!data.metadata.exportedAt || typeof data.metadata.exportedAt !== 'string') {
      errors.push('Export timestamp is required');
    }
    if (!data.metadata.exportedBy || typeof data.metadata.exportedBy !== 'string') {
      errors.push('Export application name is required');
    }
  }
  
  if (!data.loan || typeof data.loan !== 'object') {
    errors.push('Loan configuration is required');
  } else {
    const loan = data.loan;
    if (!loan.homePrice || typeof loan.homePrice !== 'string') {
      errors.push('Home price is required');
    }
    if (!loan.downPayment || typeof loan.downPayment !== 'object') {
      errors.push('Down payment configuration is required');
    }
    if (!loan.interestRate || typeof loan.interestRate !== 'string') {
      errors.push('Interest rate is required');
    }
    if (!loan.termYears || typeof loan.termYears !== 'string') {
      errors.push('Term in years is required');
    }
    if (!loan.startDate || typeof loan.startDate !== 'string') {
      errors.push('Start date is required');
    }
  }
  
  if (!Array.isArray(data.extraPayments)) {
    errors.push('Extra payments must be an array');
  } else {
    const termMonths = data.loan?.termYears ? Math.round(Number(data.loan.termYears) * 12) : 360;
    data.extraPayments.forEach((extra: ExtraItem, index: number) => {
      const result = validateExtraItem(extra, termMonths);
      if (!result.isValid) {
        errors.push(`Extra payment ${index + 1}: ${result.errors.join(', ')}`);
      }
    });
  }
  
  if (!data.recastSettings || typeof data.recastSettings !== 'object') {
    errors.push('Recast settings are required');
  } else {
    if (typeof data.recastSettings.autoRecast !== 'boolean') {
      errors.push('Auto recast setting must be a boolean');
    }
    if (!Array.isArray(data.recastSettings.recastMonths)) {
      errors.push('Recast months must be an array');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}