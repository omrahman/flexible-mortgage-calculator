// Examples of enhanced extra payment configurations
// This file demonstrates the comprehensive data structure for extra payments

import type { ExtraItem, LoanConfigurationSchema } from '../types';
import { 
  serializeLoanConfiguration, 
  deserializeLoanConfiguration,
  createSampleConfiguration 
} from '../utils/serialization';

// Example 1: Single lump sum payment
export const singlePaymentExample: ExtraItem = {
  id: 'lump-sum-1',
  month: 12,
  amount: 25000,
  type: 'single',
  description: 'Year-end bonus payment',
  category: 'bonus',
  tags: ['windfall', 'annual'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 2: Recurring monthly payment
export const recurringMonthlyExample: ExtraItem = {
  id: 'recurring-monthly-1',
  month: 6,
  amount: 500,
  type: 'recurring',
  isRecurring: true,
  recurringQuantity: 18,
  recurringFrequency: 'monthly',
  recurringEndMonth: 24,
  description: 'Monthly extra payment for 18 months',
  category: 'regular_extra',
  tags: ['monthly', 'budget', 'planned'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 3: Recurring annual payment
export const recurringAnnualExample: ExtraItem = {
  id: 'recurring-annual-1',
  month: 12,
  amount: 10000,
  type: 'recurring',
  isRecurring: true,
  recurringQuantity: 5,
  recurringFrequency: 'annually',
  description: 'Annual tax refund payment',
  category: 'tax_refund',
  tags: ['annual', 'windfall', 'tax'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 4: Escalating payment with annual increases
export const escalatingPaymentExample: ExtraItem = {
  id: 'escalating-1',
  month: 24,
  amount: 2000,
  type: 'escalating',
  isRecurring: true,
  recurringQuantity: 10,
  recurringFrequency: 'annually',
  escalationRate: 5.0, // 5% annual increase
  escalationFrequency: 'annually',
  description: 'Annual bonus with 5% escalation',
  category: 'bonus',
  tags: ['annual', 'escalating', 'bonus'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 5: Payment with constraints and precise dates
export const constrainedPaymentExample: ExtraItem = {
  id: 'constrained-1',
  month: 18,
  amount: 15000,
  type: 'single',
  description: 'Investment return payment',
  category: 'investment_return',
  tags: ['investment', 'windfall'],
  minAmount: 10000,
  maxAmount: 20000,
  startDate: '2024-06-15',
  endDate: '2024-06-30',
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 6: Complex recurring payment with escalation
export const complexRecurringExample: ExtraItem = {
  id: 'complex-recurring-1',
  month: 6,
  amount: 1000,
  type: 'escalating',
  isRecurring: true,
  recurringQuantity: 24,
  recurringFrequency: 'monthly',
  recurringEndMonth: 30,
  escalationRate: 2.0, // 2% annual escalation
  escalationFrequency: 'annually',
  description: 'Monthly extra with annual escalation',
  category: 'regular_extra',
  tags: ['monthly', 'escalating', 'budget'],
  isActive: true,
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString()
};

// Example 7: Inactive payment (for historical tracking)
export const inactivePaymentExample: ExtraItem = {
  id: 'inactive-1',
  month: 3,
  amount: 5000,
  type: 'single',
  description: 'Cancelled bonus payment',
  category: 'bonus',
  tags: ['cancelled', 'bonus'],
  isActive: false,
  createdAt: new Date('2024-01-01').toISOString(),
  lastModified: new Date('2024-02-01').toISOString()
};

// Collection of all examples
export const allExtraPaymentExamples: ExtraItem[] = [
  singlePaymentExample,
  recurringMonthlyExample,
  recurringAnnualExample,
  escalatingPaymentExample,
  constrainedPaymentExample,
  complexRecurringExample,
  inactivePaymentExample
];

// Example of a complete loan configuration with various extra payment types
export const completeLoanConfigurationExample: LoanConfigurationSchema = {
  version: '1.0.0',
  metadata: {
    exportedAt: new Date().toISOString(),
    exportedBy: 'Flexible Mortgage Calculator v1.0.0',
    description: 'Complete example with various extra payment types'
  },
  loan: {
    homePrice: '750000',
    downPayment: { type: 'percentage', value: '20' },
    interestRate: '4.25',
    termYears: '30',
    startDate: '2024-01',
    propertyTaxAnnual: '9000',
    insuranceAnnual: '1800'
  },
  extraPayments: allExtraPaymentExamples,
  recastSettings: {
    autoRecast: true,
    recastMonths: [12, 24, 36, 48, 60]
  },
  displaySettings: {
    showAll: true
  }
};

// Example of how to use the serialization utilities
export function demonstrateSerialization() {
  console.log('=== Extra Payment Examples ===');
  
  // Show individual examples
  allExtraPaymentExamples.forEach((example, index) => {
    console.log(`\nExample ${index + 1}: ${example.description}`);
    console.log(`Type: ${example.type}`);
    console.log(`Amount: $${example.amount.toLocaleString()}`);
    console.log(`Month: ${example.month}`);
    if (example.isRecurring) {
      console.log(`Recurring: ${example.recurringQuantity} times, ${example.recurringFrequency}`);
    }
    if (example.type === 'escalating') {
      console.log(`Escalation: ${example.escalationRate}% ${example.escalationFrequency}`);
    }
    console.log(`Tags: ${example.tags?.join(', ')}`);
  });
  
  // Show JSON export example
  console.log('\n=== JSON Export Example ===');
  const sampleConfig = createSampleConfiguration();
  const jsonExport = JSON.stringify(sampleConfig, null, 2);
  console.log('Sample configuration JSON:');
  console.log(jsonExport.substring(0, 500) + '...');
  
  // Show import example
  console.log('\n=== JSON Import Example ===');
  try {
    const importedConfig = deserializeLoanConfiguration(sampleConfig);
    console.log('Successfully imported configuration');
    console.log(`Extra payments count: ${importedConfig.extras.length}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Export the demonstration function for use in tests or demos
export { demonstrateSerialization };
