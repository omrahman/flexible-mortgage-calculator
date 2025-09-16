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
