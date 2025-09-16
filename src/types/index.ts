// Core data structures for mortgage calculations

export interface ExtraMap {
  [monthIndex: number]: number; // 1-based month index -> extra amount
}

export type RecurringFrequency = 'monthly' | 'annually';

export interface ExtraItem {
  id: string;
  month: number;
  amount: number;
  isRecurring?: boolean;
  recurringQuantity?: number; // number of payments
  recurringEndMonth?: number; // end month for recurring payments
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