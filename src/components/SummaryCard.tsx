import React from 'react';
import type { SummaryCardProps } from '../types';

export const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, highlight = false }) => {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
};
