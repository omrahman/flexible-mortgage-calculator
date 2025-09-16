// Serialization and deserialization utilities for loan configuration export/import

import type { 
  LoanConfigurationSchema, 
  CachedInputs, 
  ExtraItem, 
  ConfigurationValidationResult,
  ExportOptions,
  ImportOptions
} from '../types';
import { 
  SCHEMA_VERSION, 
  APPLICATION_NAME, 
  APPLICATION_VERSION 
} from '../constants';
import { validateLoanConfigurationSchema } from './validation';

/**
 * Converts CachedInputs to LoanConfigurationSchema for export
 */
export function serializeLoanConfiguration(
  inputs: CachedInputs,
  options: ExportOptions = {}
): LoanConfigurationSchema {
  const {
    includeMetadata = true,
    includeDisplaySettings = true
  } = options;

  const schema: LoanConfigurationSchema = {
    version: SCHEMA_VERSION,
    metadata: includeMetadata ? {
      exportedAt: new Date().toISOString(),
      exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`,
      description: 'Exported loan configuration'
    } : {
      exportedAt: new Date().toISOString(),
      exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`
    },
    loan: {
      homePrice: inputs.homePrice,
      downPayment: inputs.downPayment,
      interestRate: inputs.rate,
      termYears: inputs.termYears,
      startDate: inputs.startYM,
      propertyTaxAnnual: inputs.propertyTaxAnnual,
      insuranceAnnual: inputs.insuranceAnnual
    },
    extraPayments: inputs.extras.map(enhanceExtraItem),
    recastSettings: {
      autoRecast: inputs.autoRecast,
      recastMonths: inputs.recastMonthsText 
        ? parseRecastMonths(inputs.recastMonthsText)
        : []
    },
    displaySettings: includeDisplaySettings ? {
      showAll: inputs.showAll
    } : {
      showAll: false
    }
  };

  return schema;
}

/**
 * Converts LoanConfigurationSchema back to CachedInputs for import
 */
export function deserializeLoanConfiguration(
  schema: LoanConfigurationSchema,
  options: ImportOptions = {}
): CachedInputs {
  const {
    preserveIds = false,
    mergeWithExisting = false
  } = options;

  // Generate new IDs if not preserving them
  const extraPayments = schema.extraPayments.map(extra => ({
    ...extra,
    id: preserveIds ? extra.id : generateId(),
    createdAt: extra.createdAt || new Date().toISOString(),
    lastModified: new Date().toISOString()
  }));

  return {
    homePrice: schema.loan.homePrice,
    downPayment: schema.loan.downPayment,
    rate: schema.loan.interestRate,
    termYears: schema.loan.termYears,
    startYM: schema.loan.startDate,
    propertyTaxAnnual: schema.loan.propertyTaxAnnual,
    insuranceAnnual: schema.loan.insuranceAnnual,
    extras: extraPayments,
    autoRecast: schema.recastSettings.autoRecast,
    recastMonthsText: schema.recastSettings.recastMonths.join(', '),
    showAll: schema.displaySettings?.showAll || false
  };
}

/**
 * Validates and imports a JSON configuration
 */
export function importLoanConfiguration(
  jsonData: any,
  options: ImportOptions = {}
): ConfigurationValidationResult {
  const { validateSchema = true } = options;
  
  if (validateSchema) {
    const validation = validateLoanConfigurationSchema(jsonData);
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        warnings: []
      };
    }
  }

  try {
    const inputs = deserializeLoanConfiguration(jsonData, options);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      data: jsonData
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to deserialize configuration: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Exports configuration to JSON string
 */
export function exportToJSON(
  inputs: CachedInputs,
  options: ExportOptions = {}
): string {
  const schema = serializeLoanConfiguration(inputs, options);
  return JSON.stringify(schema, null, 2);
}

/**
 * Imports configuration from JSON string
 */
export function importFromJSON(
  jsonString: string,
  options: ImportOptions = {}
): ConfigurationValidationResult {
  try {
    const data = JSON.parse(jsonString);
    return importLoanConfiguration(data, options);
  } catch (error) {
    return {
      isValid: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Enhances an ExtraItem with default values for missing fields
 */
function enhanceExtraItem(extra: ExtraItem): ExtraItem {
  return {
    id: extra.id,
    month: extra.month,
    amount: extra.amount,
    isRecurring: extra.isRecurring || false,
    recurringQuantity: extra.recurringQuantity || 1,
    recurringEndMonth: extra.recurringEndMonth || 0,
    recurringFrequency: extra.recurringFrequency || 'monthly'
  };
}

/**
 * Parses recast months text into array of numbers
 */
function parseRecastMonths(text: string): number[] {
  if (!text.trim()) return [];
  
  return text
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * Generates a unique ID for extra payments
 */
function generateId(): string {
  return `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a sample configuration for testing/demo purposes
 */
export function createSampleConfiguration(): LoanConfigurationSchema {
  return {
    version: SCHEMA_VERSION,
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: `${APPLICATION_NAME} v${APPLICATION_VERSION}`,
      description: 'Sample loan configuration with various extra payment types'
    },
    loan: {
      homePrice: "500000",
      downPayment: { type: 'percentage', value: "20" },
      interestRate: "4.5",
      termYears: "30",
      startDate: "2024-01",
      propertyTaxAnnual: "6000",
      insuranceAnnual: "1200"
    },
    extraPayments: [
      {
        id: 'sample-1',
        month: 6,
        amount: 5000
      },
      {
        id: 'sample-2',
        month: 12,
        amount: 1000,
        isRecurring: true,
        recurringQuantity: 24,
        recurringFrequency: 'monthly'
      },
      {
        id: 'sample-3',
        month: 24,
        amount: 2000,
        isRecurring: true,
        recurringQuantity: 12,
        recurringFrequency: 'annually'
      }
    ],
    recastSettings: {
      autoRecast: true,
      recastMonths: [12, 24, 36]
    },
    displaySettings: {
      showAll: false
    }
  };
}
