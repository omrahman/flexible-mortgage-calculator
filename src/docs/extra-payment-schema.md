# Enhanced Extra Payment Schema Documentation

This document describes the enhanced data structure for extra payments in the Flexible Mortgage Calculator, designed to support JSON export/import functionality.

## Overview

The enhanced extra payment system supports two main types of payments:
- **Single**: One-time lump sum payments
- **Recurring**: Regular payments with specified frequency and quantity

## Data Structure

### ExtraItem Interface

```typescript
interface ExtraItem {
  // Core identification
  id: string;
  month: number;
  amount: number;
  
  // Recurrence information
  isRecurring?: boolean;
  recurringQuantity?: number;
  recurringEndMonth?: number;
  recurringFrequency?: RecurringFrequency; // 'monthly' | 'annually'
}
```

## Payment Types

### 1. Single Payments
One-time lump sum payments made at a specific month.

```json
{
  "id": "lump-sum-1",
  "month": 12,
  "amount": 25000
}
```

### 2. Recurring Payments
Regular payments that repeat at specified intervals.

```json
{
  "id": "recurring-monthly-1",
  "month": 6,
  "amount": 500,
  "isRecurring": true,
  "recurringQuantity": 18,
  "recurringFrequency": "monthly",
  "recurringEndMonth": 24
}
```


## JSON Schema for Export/Import

The complete loan configuration schema includes:

```typescript
interface LoanConfigurationSchema {
  version: string;
  metadata: {
    exportedAt: string;
    exportedBy: string;
    description?: string;
  };
  loan: {
    homePrice: string;
    downPayment: DownPaymentInput;
    interestRate: string;
    termYears: string;
    startDate: string;
    propertyTaxAnnual: string;
    insuranceAnnual: string;
  };
  extraPayments: ExtraItem[];
  recastSettings: {
    autoRecast: boolean;
    recastMonths: number[];
  };
  displaySettings: {
    showAll: boolean;
  };
}
```

## Usage Examples

### Exporting a Configuration

```typescript
import { serializeLoanConfiguration, exportToJSON } from '../utils/serialization';

const inputs: CachedInputs = {
  // ... your loan inputs
};

// Export to JSON string
const jsonString = exportToJSON(inputs, {
  includeMetadata: true,
  includeDisplaySettings: true
});

// Or get the schema object
const schema = serializeLoanConfiguration(inputs);
```

### Importing a Configuration

```typescript
import { importFromJSON, deserializeLoanConfiguration } from '../utils/serialization';

// Import from JSON string
const result = importFromJSON(jsonString, {
  validateSchema: true,
  preserveIds: false
});

if (result.isValid && result.data) {
  const inputs = deserializeLoanConfiguration(result.data);
  // Use the imported inputs
}
```

### Validation

```typescript
import { validateExtraItem, validateLoanConfigurationSchema } from '../utils/validation';

// Validate individual extra payment
const validation = validateExtraItem(extraItem, termMonths);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Validate complete configuration
const configValidation = validateLoanConfigurationSchema(jsonData);
if (!configValidation.isValid) {
  console.error('Configuration errors:', configValidation.errors);
}
```

## Migration from Legacy Format

The enhanced structure is backward compatible with the existing `ExtraItem` interface. Legacy extra payments will be automatically enhanced with default values:

- `isRecurring`: Defaults to false
- `recurringQuantity`: Defaults to 1
- `recurringFrequency`: Defaults to 'monthly'

## Best Practices

1. **Use descriptive IDs**: Include payment type and purpose in the ID
2. **Set appropriate recurrence**: Use `recurringQuantity` and `recurringEndMonth` to control payment duration
3. **Choose correct frequency**: Use 'monthly' for regular payments, 'annually' for yearly payments
4. **Validate end months**: Ensure `recurringEndMonth` is within the loan term

## Future Enhancements

The schema is designed to be extensible. Future versions may include:
- Payment dependencies (e.g., payment B only if payment A is made)
- Conditional payments based on loan balance or other factors
- Payment templates for common scenarios
- Integration with external financial data sources
