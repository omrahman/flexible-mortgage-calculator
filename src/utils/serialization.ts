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
import pako from 'pako';

/**
 * Converts a Uint8Array to a binary string for btoa.
 */
function uint8ArrayToBinaryString(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return binary;
}

/**
 * Converts a binary string from atob to a Uint8Array.
 */
function binaryStringToUint8Array(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

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
    forgivenessPayments: inputs.extras.filter(e => e.isForgiveness).map(enhanceExtraItem),
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
    preserveIds = false
  } = options;

  // Generate new IDs if not preserving them
  const extraPayments = schema.extraPayments.map(extra => ({
    ...extra,
    id: preserveIds ? extra.id : generateId(),
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
    extras: [...extraPayments, ...(schema.forgivenessPayments?.map(enhanceExtraItem) || [])],
    autoRecast: schema.recastSettings.autoRecast,
    recastMonthsText: schema.recastSettings.recastMonths.join(', '),
    showAll: schema.displaySettings?.showAll || false
  };
}

/**
 * Validates and imports a JSON configuration
 */
export function importLoanConfiguration(
  jsonData: LoanConfigurationSchema,
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
    deserializeLoanConfiguration(jsonData, options);
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
 * Exports configuration to a URL-safe string
 */
export function exportToUrl(
  inputs: CachedInputs,
  options: ExportOptions = {}
): string {
  const schema = serializeLoanConfiguration(inputs, {
    ...options,
    includeMetadata: false,
    includeDisplaySettings: false,
  });
  const jsonString = JSON.stringify(schema);
  const compressed = pako.deflate(jsonString); // Uint8Array
  const binaryString = uint8ArrayToBinaryString(compressed);
  const base64 = btoa(binaryString);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Imports configuration from a URL-safe string
 */
export function importFromUrl(
  encodedString: string,
  options: ImportOptions = {}
): ConfigurationValidationResult {
  try {
    let base64 = encodedString.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binaryString = atob(base64);
    const compressed = binaryStringToUint8Array(binaryString);
    const jsonString = pako.inflate(compressed, { to: 'string' });
    const data = JSON.parse(jsonString);
    return importLoanConfiguration(data, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      errors: [`Invalid URL data: ${errorMessage}`],
      warnings: [],
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
    forgivenessPayments: [],
    recastSettings: {
      autoRecast: true,
      recastMonths: [12, 24, 36]
    },
    displaySettings: {
      showAll: false
    }
  };
}
