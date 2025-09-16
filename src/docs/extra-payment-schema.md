# Enhanced Extra Payment Schema Documentation

This document describes the comprehensive data structure for extra payments in the Flexible Mortgage Calculator, designed to support JSON export/import functionality.

## Overview

The enhanced extra payment system supports three main types of payments:
- **Single**: One-time lump sum payments
- **Recurring**: Regular payments with specified frequency and quantity
- **Escalating**: Payments that increase over time at a specified rate

## Data Structure

### ExtraItem Interface

```typescript
interface ExtraItem {
  // Core identification
  id: string;
  month: number;
  amount: number;
  type: ExtraPaymentType; // 'single' | 'recurring' | 'escalating'
  
  // Recurrence information
  isRecurring?: boolean;
  recurringQuantity?: number;
  recurringEndMonth?: number;
  recurringFrequency?: RecurringFrequency; // 'monthly' | 'annually'
  
  // Escalation information
  escalationRate?: number; // Annual escalation rate as percentage
  escalationFrequency?: RecurringFrequency;
  
  // Metadata
  description?: string;
  category?: string;
  tags?: string[];
  
  // Validation constraints
  minAmount?: number;
  maxAmount?: number;
  
  // Date information
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  
  // Status and tracking
  isActive?: boolean;
  createdAt?: string; // ISO timestamp
  lastModified?: string; // ISO timestamp
}
```

## Payment Types

### 1. Single Payments
One-time lump sum payments made at a specific month.

```json
{
  "id": "lump-sum-1",
  "month": 12,
  "amount": 25000,
  "type": "single",
  "description": "Year-end bonus payment",
  "category": "bonus",
  "tags": ["windfall", "annual"]
}
```

### 2. Recurring Payments
Regular payments that repeat at specified intervals.

```json
{
  "id": "recurring-monthly-1",
  "month": 6,
  "amount": 500,
  "type": "recurring",
  "isRecurring": true,
  "recurringQuantity": 18,
  "recurringFrequency": "monthly",
  "recurringEndMonth": 24,
  "description": "Monthly extra payment for 18 months",
  "category": "regular_extra"
}
```

### 3. Escalating Payments
Payments that increase over time at a specified rate.

```json
{
  "id": "escalating-1",
  "month": 24,
  "amount": 2000,
  "type": "escalating",
  "isRecurring": true,
  "recurringQuantity": 10,
  "recurringFrequency": "annually",
  "escalationRate": 5.0,
  "escalationFrequency": "annually",
  "description": "Annual bonus with 5% escalation",
  "category": "bonus"
}
```

## Categories and Tags

### Predefined Categories
- `bonus`: Work bonuses or performance payments
- `tax_refund`: Tax refund payments
- `regular_extra`: Regular budgeted extra payments
- `windfall`: Unexpected large payments
- `refinance_proceeds`: Money from refinancing
- `investment_return`: Investment gains
- `other`: Miscellaneous payments

### Common Tags
- `monthly`, `annual`, `quarterly`: Payment frequency
- `windfall`, `budget`: Payment source
- `bonus`, `tax`, `investment`: Payment type
- `refinance`, `emergency`: Special circumstances

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

- `type`: Defaults to 'single'
- `isRecurring`: Defaults to false
- `recurringQuantity`: Defaults to 1
- `recurringFrequency`: Defaults to 'monthly'
- `isActive`: Defaults to true
- `createdAt`/`lastModified`: Set to current timestamp

## Best Practices

1. **Use descriptive IDs**: Include payment type and purpose in the ID
2. **Provide descriptions**: Help users understand the payment purpose
3. **Use categories and tags**: Enable better organization and filtering
4. **Set appropriate constraints**: Use min/max amounts for validation
5. **Track changes**: Always update `lastModified` when making changes
6. **Use precise dates**: Include start/end dates for time-sensitive payments

## Future Enhancements

The schema is designed to be extensible. Future versions may include:
- Payment dependencies (e.g., payment B only if payment A is made)
- Conditional payments based on loan balance or other factors
- Payment templates for common scenarios
- Integration with external financial data sources
