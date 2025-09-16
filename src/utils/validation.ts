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
export function validateExtraItem(extra: any, termMonths: number): ValidationResult {
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
  
  if (!extra.type || !['single', 'recurring', 'escalating'].includes(extra.type)) {
    errors.push('Type must be one of: single, recurring, escalating');
  }
  
  // Recurring payment validation
  if (extra.type === 'recurring' || extra.isRecurring) {
    if (!Number.isFinite(extra.recurringQuantity) || extra.recurringQuantity < 1) {
      errors.push('Recurring quantity must be at least 1');
    }
    
    if (!extra.recurringFrequency || !['monthly', 'annually'].includes(extra.recurringFrequency)) {
      errors.push('Recurring frequency must be monthly or annually');
    }
    
    if (extra.recurringEndMonth && (extra.recurringEndMonth < extra.month || extra.recurringEndMonth > termMonths)) {
      errors.push('Recurring end month must be after start month and within loan term');
    }
  }
  
  // Escalating payment validation
  if (extra.type === 'escalating') {
    if (!Number.isFinite(extra.escalationRate) || extra.escalationRate < 0) {
      errors.push('Escalation rate must be a non-negative number');
    }
    
    if (extra.escalationFrequency && !['monthly', 'annually'].includes(extra.escalationFrequency)) {
      errors.push('Escalation frequency must be monthly or annually');
    }
  }
  
  // Amount constraints validation
  if (extra.minAmount !== undefined && (!Number.isFinite(extra.minAmount) || extra.minAmount < 0)) {
    errors.push('Minimum amount must be a non-negative number');
  }
  
  if (extra.maxAmount !== undefined && (!Number.isFinite(extra.maxAmount) || extra.maxAmount < 0)) {
    errors.push('Maximum amount must be a non-negative number');
  }
  
  if (extra.minAmount !== undefined && extra.maxAmount !== undefined && extra.minAmount > extra.maxAmount) {
    errors.push('Minimum amount cannot be greater than maximum amount');
  }
  
  if (extra.minAmount !== undefined && extra.amount < extra.minAmount) {
    errors.push('Amount cannot be less than minimum amount');
  }
  
  if (extra.maxAmount !== undefined && extra.amount > extra.maxAmount) {
    errors.push('Amount cannot be greater than maximum amount');
  }
  
  // Date validation
  if (extra.startDate && !isValidDate(extra.startDate)) {
    errors.push('Start date must be in YYYY-MM-DD format');
  }
  
  if (extra.endDate && !isValidDate(extra.endDate)) {
    errors.push('End date must be in YYYY-MM-DD format');
  }
  
  if (extra.startDate && extra.endDate && new Date(extra.startDate) >= new Date(extra.endDate)) {
    errors.push('End date must be after start date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to validate date format
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

// Validation for loan configuration schema
export function validateLoanConfigurationSchema(data: any): ValidationResult {
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
    data.extraPayments.forEach((extra: any, index: number) => {
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