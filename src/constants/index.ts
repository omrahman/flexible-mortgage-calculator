// Application constants and configuration

export const DEFAULT_HOME_PRICE = "1000000";
export const DEFAULT_DOWN_PAYMENT = { type: 'percentage' as const, value: "20" };
export const DEFAULT_INTEREST_RATE = "4.85";
export const DEFAULT_TERM_YEARS = "30";
export const DEFAULT_PROPERTY_TAX_ANNUAL = "12000"; // $12,000 annual property tax
export const DEFAULT_INSURANCE_ANNUAL = "2400"; // $2,400 annual insurance
export const DEFAULT_EXTRA_PAYMENTS = [
  { 
    id: 'default-1', 
    month: 6, 
    amount: 150000,
    type: 'single' as const,
    description: 'Tax refund payment',
    category: 'tax_refund',
    tags: ['windfall', 'annual'],
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
  { 
    id: 'default-2', 
    month: 12, 
    amount: 5000,
    type: 'recurring' as const,
    isRecurring: true,
    recurringQuantity: 12,
    recurringFrequency: 'monthly' as const,
    description: 'Monthly extra payment',
    category: 'regular_extra',
    tags: ['monthly', 'budget'],
    isActive: true,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  },
];

export const ROUNDING_PRECISION = 2;
export const MAX_ITERATIONS = 600; // Safety guard for calculation loops
export const MIN_BALANCE_THRESHOLD = 0.001; // Minimum balance to consider paid off
export const PAYMENT_DIFFERENCE_THRESHOLD = 0.005; // Minimum payment change to trigger recast

export const CSV_FILENAME = "amortization_recast_schedule.csv";
export const CSV_MIME_TYPE = "text/csv";

export const CHART_HEIGHT = 288; // 72 * 4 (h-72 in Tailwind)
export const SCHEDULE_PREVIEW_ROWS = 24;

// JSON Schema and export/import constants
export const SCHEMA_VERSION = "1.0.0";
export const APPLICATION_NAME = "Flexible Mortgage Calculator";
export const APPLICATION_VERSION = "1.0.0"; // This should match package.json version

// Extra payment categories
export const EXTRA_PAYMENT_CATEGORIES = [
  'bonus',
  'tax_refund', 
  'regular_extra',
  'windfall',
  'refinance_proceeds',
  'investment_return',
  'other'
] as const;

// Extra payment tags
export const COMMON_EXTRA_PAYMENT_TAGS = [
  'monthly',
  'annual', 
  'quarterly',
  'windfall',
  'budget',
  'bonus',
  'tax',
  'investment',
  'refinance',
  'emergency'
] as const;
