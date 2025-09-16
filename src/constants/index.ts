// Application constants and configuration

export const DEFAULT_HOME_PRICE = "1000000";
export const DEFAULT_DOWN_PAYMENT = { type: 'percentage' as const, value: "20" };
export const DEFAULT_INTEREST_RATE = "4.85";
export const DEFAULT_TERM_YEARS = "30";
export const DEFAULT_PROPERTY_TAX_ANNUAL = "12000"; // $12,000 annual property tax
export const DEFAULT_INSURANCE_ANNUAL = "2400"; // $2,400 annual insurance
export const DEFAULT_EXTRA_PAYMENTS = [
  { id: 'default-1', month: 6, amount: 10000 },
  { id: 'default-2', month: 12, amount: 5000 },
];

export const ROUNDING_PRECISION = 2;
export const MAX_ITERATIONS = 600; // Safety guard for calculation loops
export const MIN_BALANCE_THRESHOLD = 0.001; // Minimum balance to consider paid off
export const PAYMENT_DIFFERENCE_THRESHOLD = 0.005; // Minimum payment change to trigger recast

export const CSV_FILENAME = "amortization_recast_schedule.csv";
export const CSV_MIME_TYPE = "text/csv";

export const CHART_HEIGHT = 288; // 72 * 4 (h-72 in Tailwind)
export const SCHEDULE_PREVIEW_ROWS = 24;
