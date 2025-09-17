// Core data structures for mortgage calculations

export type ColorStops = [string, string];

export interface ExtraMap {
  [monthIndex: number]: number; // 1-based month index -> extra amount
}

export interface ForgivenessMap {
  [monthIndex: number]: number; // 1-based month index -> forgiveness amount
}

export type RecurringFrequency = 'monthly' | 'annually';
export type ScheduleSegment = { start: number; payment: number };

// Manually define the return type of the useMortgageCalculation hook to avoid circular dependencies
export type MortgageHook = {
  homePrice: string;
  setHomePrice: (value: string) => void;
  downPayment: DownPaymentInput;
  setDownPayment: (value: DownPaymentInput) => void;
  principal: number;
  rate: string;
  setRate: (value: string) => void;
  termYears: string;
  setTermYears: (value: string) => void;
  startYM: string;
  setStartYM: (value: string) => void;
  propertyTaxAnnual: string;
  setPropertyTaxAnnual: (value: string) => void;
  insuranceAnnual: string;
  setInsuranceAnnual: (value:string) => void;
  extras: ExtraItem[];
  autoRecast: boolean;
  setAutoRecast: (value: boolean) => void;
  recastMonthsText: string;
  setRecastMonthsText: (value: string) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  termMonths: number;
  monthlyPITI: { propertyTax: number; insurance: number; total: number };
  result: ScheduleResult;
  baseline: ScheduleResult;
  interestSaved: number;
  monthsSaved: number;
  cachedInputs: CachedInputs;
  params: ScheduleParams;
  handleAddExtra: () => void;
  handleRemoveExtra: (id: string) => void;
  handleUpdateExtra: (id: string, fieldOrUpdates: keyof ExtraItem | Partial<ExtraItem>, value?: number | boolean | RecurringFrequency) => void;
  clearAllInputs: () => void;
  loadConfiguration: (configInputs: CachedInputs, configId?: string) => void;
  clearLoadedConfiguration: () => void;
  markChangesAsSaved: () => void;
  loadedConfigurationId: string | null;
  hasUnsavedChanges: boolean;
};


export interface ExtraItem {
  id: string;
  month: number;
  amount: number;
  monthInput?: MonthInput; // UI state for month input type and value
  defaultOpen?: boolean;
  
  // Payment type
  isForgiveness?: boolean; // true for loan forgiveness, false for extra principal payment
  
  // Recurrence information
  isRecurring?: boolean;
  recurringQuantity?: number; // number of payments
  recurringFrequency?: RecurringFrequency; // frequency of recurring payments
}

export interface ForgivenessItem {
  id: string;
  month: number;
  amount: number;
  monthInput?: MonthInput; // UI state for month input type and value
  
  // Recurrence information
  isRecurring?: boolean;
  recurringQuantity?: number; // number of payments
  recurringFrequency?: RecurringFrequency; // frequency of recurring payments
}

export interface BalanceChartRow {
  idx: number;
  paymentDate: string; // YYYY-MM
  scheduledPayment: number; // scheduled P&I this month (capped to payoff)
  interest: number; // interest paid this month
  scheduledPrincipal: number; // scheduled principal paid this month
  extraPrincipal: number; // extra principal paid this month
  forgivenPrincipal: number; // forgiven principal this month
  actualPayment: number; // total cash out this month
  loanBalance: number; // ending balance after this month
  cumulativeInterest: number; // cumulative interest paid up to this month
  cumulativePrincipal: number; // cumulative principal paid up to this month
  cumulativeForgiveness: number; // cumulative forgiveness up to this month
  recast?: boolean; // did a recast trigger at end of this month
  newPayment?: number; // if recast, new scheduled P&I
}

export interface ScheduleResult {
  rows: BalanceChartRow[];
  totalInterest: number;
  totalPaid: number;
  totalForgiveness: number; // total forgiveness amount
  payoffMonth: number; // 1-based index of final month
  segments: { start: number; payment: number }[]; // payment changes over time
  chart: { name: string; balance: number; cumulativeInterest: number; cumulativePrincipal: number; cumulativeForgiveness: number }[];
}

export interface ScheduleParams {
  principal: number;
  annualRatePct: number;
  termMonths: number;
  startYM: string;
  extraPayments: ExtraMap;
  forgiveness: ForgivenessMap;
  recastMonths: Set<number>;
  autoRecastOnExtra: boolean;
}

export interface SummaryCardProps {
  label: string;
  value: string;
  highlight?: boolean;
  tooltip?: string;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

// Down payment input types
export type DownPaymentType = 'percentage' | 'amount';

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
  summary?: LoanSummary;
}

// Interface for the compact loan summary
export interface LoanSummary {
  // Core Loan & Payment Info
  loanAmount: number;
  originalPI: number;
  currentPI: number;
  originalPITI: number;
  currentPITI: number;

  // Savings
  totalInterestBaseline: number;
  totalInterestCurrent: number;
  interestSaved: number;
  monthsSaved: number;
  payoffDate: string; // YYYY-MM

  // Payment Totals
  totalPaid: number;
  totalPrincipalPaid: number;
  totalExtraPayments: number;
  totalForgiveness: number;

  // Lender Metrics
  lenderProfit: number;
  lenderROI: number;
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
  forgivenessPayments: ForgivenessItem[];
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