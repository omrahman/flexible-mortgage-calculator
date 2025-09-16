import React from 'react';
import type { ExtraItem } from '../types';

interface ExtraPaymentsProps {
  extras: ExtraItem[];
  termMonths: number;
  autoRecast: boolean;
  setAutoRecast: (value: boolean) => void;
  recastMonthsText: string;
  setRecastMonthsText: (value: string) => void;
  onAddExtra: () => void;
  onRemoveExtra: (id: string) => void;
  onUpdateExtra: (id: string, field: keyof ExtraItem, value: number) => void;
}

export const ExtraPayments: React.FC<ExtraPaymentsProps> = ({
  extras,
  termMonths,
  autoRecast,
  setAutoRecast,
  recastMonthsText,
  setRecastMonthsText,
  onAddExtra,
  onRemoveExtra,
  onUpdateExtra,
}) => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow space-y-4">
      <h2 className="text-xl font-semibold">Extra Payments</h2>
      <p className="text-sm text-gray-600">
        Add lump sums by month number (1 = first month). If multiple extras land on the same month, they aggregate.
      </p>
      <div className="space-y-2">
        {extras.map((e) => (
          <div key={e.id} className="grid grid-cols-7 gap-2 items-end">
            <div className="col-span-2">
              <span className="text-xs text-gray-500">Month #</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                type="number"
                min={1}
                max={termMonths}
                step="1"
                value={e.month}
                onChange={(ev) => {
                  const v = parseInt(ev.target.value || "0", 10);
                  onUpdateExtra(e.id, 'month', v);
                }}
              />
            </div>
            <div className="col-span-3">
              <span className="text-xs text-gray-500">Amount</span>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                type="number"
                min={0}
                step="100"
                value={e.amount}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value || "0");
                  onUpdateExtra(e.id, 'amount', v);
                }}
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                className="mt-6 flex-1 rounded-xl border px-3 py-2 hover:bg-gray-50"
                onClick={() => onRemoveExtra(e.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <div>
          <button
            className="rounded-xl bg-black text-white px-4 py-2"
            onClick={onAddExtra}
          >
            + Add Extra
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRecast}
            onChange={(e) => setAutoRecast(e.target.checked)}
          />
          <span>Recast automatically after any month with an extra payment</span>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">
            Additionally recast on these months (e.g. 24, 60-72)
          </span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            placeholder=""
            value={recastMonthsText}
            onChange={(e) => setRecastMonthsText(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};
