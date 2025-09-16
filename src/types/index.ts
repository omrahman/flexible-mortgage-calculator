// Core data structures for mortgage calculations

export interface ExtraMap {
  [monthIndex: number]: number; // 1-based month index -> extra amount
}

export interface ExtraItem {
  id: string;
  month: number;
  amount: number;
  isRecurring?: boolean;
  recurringQuantity?: number; // number of payments
  recurringEndMonth?: number; // end month for recurring payments
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
