import React from 'react';
import type { SummaryCardProps } from '../types';

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, highlight = false }) => {
  return (
    <div className={`rounded-2xl border p-3 sm:p-4 min-w-0 ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
      <div className="text-xs text-gray-500 leading-tight">{label}</div>
      <div className="text-sm sm:text-lg font-semibold mt-1 leading-tight">{value}</div>
    </div>
  );
};
