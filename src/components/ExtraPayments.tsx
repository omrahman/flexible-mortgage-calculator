import React from 'react';
import type { ExtraItem, RecurringFrequency } from '../types';

interface ExtraPaymentsProps {
  extras: ExtraItem[];
  termMonths: number;
  autoRecast: boolean;
  setAutoRecast: (value: boolean) => void;
  recastMonthsText: string;
  setRecastMonthsText: (value: string) => void;
  onAddExtra: () => void;
  onRemoveExtra: (id: string) => void;
  onUpdateExtra: (id: string, fieldOrUpdates: keyof ExtraItem | Partial<ExtraItem>, value?: number | boolean | RecurringFrequency) => void;
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
        Add lump sums by month number (1 = first month). You can make payments recurring with a quantity and/or end date. If multiple extras land on the same month, they aggregate.
      </p>
      <div className="space-y-4">
        {extras.map((e) => (
          <div key={e.id} className="border rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-7 gap-3 items-end">
              <div className="col-span-2">
                <span className="text-xs text-gray-500">Start Month #</span>
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
              <div className="col-span-2 flex justify-end">
                <button
                  className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => onRemoveExtra(e.id)}
                >
                  Remove
                </button>
              </div>
            </div>
            
            {/* Recurring Payment Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(e.isRecurring)}
                  onChange={(ev) => {
                    const isChecked = ev.target.checked;
                    if (isChecked) {
                      onUpdateExtra(e.id, 'isRecurring', true);
                    } else {
                      // Reset all recurring fields when unchecked in a single update
                      onUpdateExtra(e.id, {
                        isRecurring: false,
                        recurringQuantity: 1,
                        recurringEndMonth: 0,
                        recurringFrequency: 'monthly'
                      });
                    }
                  }}
                />
                <span className="text-sm font-medium">Make this a recurring payment</span>
              </label>
              
              {Boolean(e.isRecurring) && (
                <div className="space-y-4">
                  {/* Frequency Selection */}
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Payment frequency</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`frequency-${e.id}`}
                          value="monthly"
                          checked={(e.recurringFrequency || 'monthly') === 'monthly'}
                          onChange={(ev) => {
                            onUpdateExtra(e.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
                          }}
                        />
                        <span className="text-sm">Monthly</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`frequency-${e.id}`}
                          value="annually"
                          checked={e.recurringFrequency === 'annually'}
                          onChange={(ev) => {
                            onUpdateExtra(e.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
                          }}
                        />
                        <span className="text-sm">Annually</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Payment Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">
                        Number of payments
                        {e.recurringFrequency === 'annually' && (
                          <span className="text-gray-400 ml-1">(years)</span>
                        )}
                      </span>
                      <input
                        className="mt-1 w-full rounded-xl border p-2"
                        type="number"
                        min={1}
                        max={e.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths}
                        step="1"
                        value={e.recurringQuantity || 1}
                        onChange={(ev) => {
                          const v = parseInt(ev.target.value || "1", 10);
                          onUpdateExtra(e.id, 'recurringQuantity', v);
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">
                        End month (optional)
                        {e.recurringFrequency === 'annually' && (
                          <span className="text-gray-400 ml-1">(will be adjusted to year boundaries)</span>
                        )}
                      </span>
                      <input
                        className="mt-1 w-full rounded-xl border p-2"
                        type="number"
                        min={e.month + (e.recurringFrequency === 'annually' ? 12 : 1)}
                        max={termMonths}
                        step={e.recurringFrequency === 'annually' ? "12" : "1"}
                        value={e.recurringEndMonth || ''}
                        onChange={(ev) => {
                          const v = parseInt(ev.target.value || "0", 10);
                          onUpdateExtra(e.id, 'recurringEndMonth', v || 0);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
