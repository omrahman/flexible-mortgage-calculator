// Core data structures for mortgage calculations

export interface ExtraMap {
  [monthIndex: number]: number; // 1-based month index -> extra amount
}

export type RecurringFrequency = 'monthly' | 'annually';

export interface ExtraItem {
  id: string;
  month: number;
  amount: number;
  monthInput?: MonthInput; // UI state for month input type and value
  
  // Recurrence information
  isRecurring?: boolean;
  recurringQuantity?: number; // number of payments
  recurringFrequency?: RecurringFrequency; // frequency of recurring payments
}

export interface Row {
  idx: number;
  date: string; // YYYY-MM
  payment: number; // scheduled P&I this month (capped to payoff)
  interest: number;
  principal: number;
  extra: number; // extra paid this month
  total: number; // total cash out this month
  balance: number; // ending balance after this month
  recast?: boolean; // did a recast trigger at end of this month
  newPayment?: number; // if recast, new scheduled P&I
}

export interface ScheduleResult {
  rows: Row[];
  totalInterest: number;
  totalPaid: number;
  payoffMonth: number; // 1-based index of final month
  segments: { start: number; payment: number }[]; // payment changes over time
  chart: { name: string; balance: number }[];
}

export interface ScheduleParams {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  startYM: string;
  extras: ExtraMap;
  recastMonths: Set<number>;
  autoRecastOnExtra: boolean;
}

export interface SummaryCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

// Down payment input types
export type DownPaymentType = 'percentage' | 'dollar';

export interface DownPaymentInput {
  type: DownPaymentType;
  value: string; // percentage (0-100) or dollar amount
}

// Month input types for extra payments
export type MonthInputType = 'number' | 'yearmonth';

export interface MonthInput {
  type: MonthInputType;
  value: string; // month number (1-based) or YYYY-MM format
}

// Interface for cached user inputs in localStorage
export interface CachedInputs {
  homePrice: string; // Total home price
  downPayment: DownPaymentInput;
  rate: string;
  termYears: string;
  startYM: string;
  propertyTaxAnnual: string; // Annual property tax amount
  insuranceAnnual: string; // Annual insurance amount
  extras: ExtraItem[];
  autoRecast: boolean;
  recastMonthsText?: string; // Optional - only used when user specifies recast months
  showAll: boolean;
}

// Interface for saved loan configurations
export interface SavedConfiguration {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  inputs: CachedInputs;
}

// Interface for configuration management component props
export interface SavedConfigurationsProps {
  configurations: SavedConfiguration[];
  onLoadConfiguration: (config: SavedConfiguration) => void;
  onSaveConfiguration: (name: string, description?: string) => void;
  onDeleteConfiguration: (id: string) => void;
  onUpdateConfiguration: (id: string, name: string, description: string, inputs: CachedInputs) => void;
  currentInputs: CachedInputs;
  loadedConfiguration?: SavedConfiguration | null;
  onClearLoadedConfiguration: () => void;
}

// Interface for configuration modal props
export interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description?: string) => void;
  onUpdate?: (id: string, name: string, description?: string) => void;
  editingConfig?: SavedConfiguration | null;
  currentInputs: CachedInputs;
}

// JSON Schema for loan configuration export/import
export interface LoanConfigurationSchema {
  version: string; // Schema version for future compatibility
  metadata: {
    exportedAt: string; // ISO timestamp
    exportedBy: string; // Application name and version
    description?: string;
  };
  loan: {
    homePrice: string;
    downPayment: DownPaymentInput;
    interestRate: string;
    termYears: string;
    startDate: string; // YYYY-MM format
    propertyTaxAnnual: string;
    insuranceAnnual: string;
  };
  extraPayments: ExtraItem[];
  recastSettings: {
    autoRecast: boolean;
    recastMonths: number[]; // Array of month numbers for manual recast
  };
  displaySettings: {
    showAll: boolean;
  };
}

// Validation result for configuration import
export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: LoanConfigurationSchema;
}

// Export/Import utility types
export interface ExportOptions {
  includeMetadata?: boolean;
  includeDisplaySettings?: boolean;
  format?: 'json' | 'yaml';
}

export interface ImportOptions {
  validateSchema?: boolean;
  mergeWithExisting?: boolean;
  preserveIds?: boolean;
}