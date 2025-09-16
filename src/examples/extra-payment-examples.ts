// Examples of enhanced extra payment configurations
// This file demonstrates the simplified data structure for extra payments

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
  amount: 25000
};

// Example 2: Recurring monthly payment
export const recurringMonthlyExample: ExtraItem = {
  id: 'recurring-monthly-1',
  month: 6,
  amount: 500,
  isRecurring: true,
  recurringQuantity: 18,
  recurringFrequency: 'monthly',
  recurringEndMonth: 24
};

// Example 3: Recurring annual payment
export const recurringAnnualExample: ExtraItem = {
  id: 'recurring-annual-1',
  month: 12,
  amount: 10000,
  isRecurring: true,
  recurringQuantity: 5,
  recurringFrequency: 'annually'
};

// Example 4: Recurring payment with end month
export const recurringWithEndMonthExample: ExtraItem = {
  id: 'recurring-end-1',
  month: 24,
  amount: 2000,
  isRecurring: true,
  recurringQuantity: 10,
  recurringFrequency: 'annually',
  recurringEndMonth: 120
};

// Collection of all examples
export const allExtraPaymentExamples: ExtraItem[] = [
  singlePaymentExample,
  recurringMonthlyExample,
  recurringAnnualExample,
  recurringWithEndMonthExample
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
    console.log(`\nExample ${index + 1}: ${example.id}`);
    console.log(`Amount: $${example.amount.toLocaleString()}`);
    console.log(`Month: ${example.month}`);
    if (example.isRecurring) {
      console.log(`Recurring: ${example.recurringQuantity} times, ${example.recurringFrequency}`);
      if (example.recurringEndMonth) {
        console.log(`End month: ${example.recurringEndMonth}`);
      }
    } else {
      console.log('Single payment');
    }
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
