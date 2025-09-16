import React from 'react';
import { useRobustInputField, useRobustNumberField } from '../hooks';
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

interface ExtraPaymentItemProps {
  extra: ExtraItem;
  termMonths: number;
  onUpdateExtra: (id: string, fieldOrUpdates: keyof ExtraItem | Partial<ExtraItem>, value?: number | boolean | RecurringFrequency) => void;
  onRemoveExtra: (id: string) => void;
}

const ExtraPaymentItem: React.FC<ExtraPaymentItemProps> = ({ extra, termMonths, onUpdateExtra, onRemoveExtra }) => {
  // Month field hook
  const monthField = useRobustNumberField({
    initialValue: extra.month,
    defaultValue: 1,
    onValueChange: (value) => onUpdateExtra(extra.id, 'month', value),
    validate: (value) => value >= 1 && value <= termMonths,
    min: 1,
    max: termMonths
  });

  // Amount field hook
  const amountField = useRobustNumberField({
    initialValue: extra.amount,
    defaultValue: 1000,
    onValueChange: (value) => onUpdateExtra(extra.id, 'amount', value),
    validate: (value) => value >= 0,
    min: 0
  });

  // Recurring quantity field hook
  const quantityField = useRobustNumberField({
    initialValue: extra.recurringQuantity || 1,
    defaultValue: 1,
    onValueChange: (value) => onUpdateExtra(extra.id, 'recurringQuantity', value),
    validate: (value) => value >= 1,
    min: 1,
    max: extra.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths
  });

  // Recurring end month field hook
  const endMonthField = useRobustNumberField({
    initialValue: extra.recurringEndMonth || 0,
    defaultValue: 0,
    onValueChange: (value) => onUpdateExtra(extra.id, 'recurringEndMonth', value),
    validate: (value) => value === 0 || (value >= extra.month + (extra.recurringFrequency === 'annually' ? 12 : 1) && value <= termMonths),
    min: extra.month + (extra.recurringFrequency === 'annually' ? 12 : 1),
    max: termMonths
  });

  return (
    <div className="border rounded-xl p-3 sm:p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
        <div className="col-span-1 sm:col-span-2">
          <span className="text-xs text-gray-500">Start Month #</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="number"
            min={1}
            max={termMonths}
            step="1"
            value={monthField.value}
            onChange={(e) => monthField.onChange(e.target.value)}
            onFocus={monthField.onFocus}
            onBlur={monthField.onBlur}
          />
        </div>
        <div className="col-span-1 sm:col-span-3">
          <span className="text-xs text-gray-500">Amount</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="number"
            min={0}
            step="100"
            value={amountField.value}
            onChange={(e) => amountField.onChange(e.target.value)}
            onFocus={amountField.onFocus}
            onBlur={amountField.onBlur}
          />
        </div>
        <div className="col-span-1 sm:col-span-2 flex justify-end">
          <button
            className="rounded-xl border px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-50 whitespace-nowrap"
            onClick={() => onRemoveExtra(extra.id)}
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
            checked={Boolean(extra.isRecurring)}
            onChange={(ev) => {
              const isChecked = ev.target.checked;
              if (isChecked) {
                onUpdateExtra(extra.id, 'isRecurring', true);
              } else {
                // Reset all recurring fields when unchecked in a single update
                onUpdateExtra(extra.id, {
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
        
        {Boolean(extra.isRecurring) && (
          <div className="space-y-4">
            {/* Frequency Selection */}
            <div>
              <span className="text-xs text-gray-500 block mb-2">Payment frequency</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`frequency-${extra.id}`}
                    value="monthly"
                    checked={(extra.recurringFrequency || 'monthly') === 'monthly'}
                    onChange={(ev) => {
                      onUpdateExtra(extra.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
                    }}
                  />
                  <span className="text-sm">Monthly</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`frequency-${extra.id}`}
                    value="annually"
                    checked={extra.recurringFrequency === 'annually'}
                    onChange={(ev) => {
                      onUpdateExtra(extra.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
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
                  {extra.recurringFrequency === 'annually' && (
                    <span className="text-gray-400 ml-1">(years)</span>
                  )}
                </span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="number"
                  min={1}
                  max={extra.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths}
                  step="1"
                  value={quantityField.value}
                  onChange={(e) => quantityField.onChange(e.target.value)}
                  onFocus={quantityField.onFocus}
                  onBlur={quantityField.onBlur}
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  End month (optional)
                  {extra.recurringFrequency === 'annually' && (
                    <span className="text-gray-400 ml-1">(will be adjusted to year boundaries)</span>
                  )}
                </span>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  type="number"
                  min={extra.month + (extra.recurringFrequency === 'annually' ? 12 : 1)}
                  max={termMonths}
                  step={extra.recurringFrequency === 'annually' ? "12" : "1"}
                  value={endMonthField.value}
                  onChange={(e) => endMonthField.onChange(e.target.value)}
                  onFocus={endMonthField.onFocus}
                  onBlur={endMonthField.onBlur}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
  // Recast months text field hook
  const recastMonthsField = useRobustInputField({
    initialValue: recastMonthsText,
    defaultValue: '',
    onValueChange: setRecastMonthsText,
    validate: () => true, // Allow any text input for recast months
    allowEmpty: true
  });

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Extra Payments</h2>
      <p className="text-sm text-gray-600 leading-relaxed">
        Add lump sums by month number (1 = first month). You can make payments recurring with a quantity and/or end date. If multiple extras land on the same month, they aggregate.
      </p>
      <div className="space-y-4">
        {extras.map((extra) => (
          <ExtraPaymentItem
            key={extra.id}
            extra={extra}
            termMonths={termMonths}
            onUpdateExtra={onUpdateExtra}
            onRemoveExtra={onRemoveExtra}
          />
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
            value={recastMonthsField.value}
            onChange={(e) => recastMonthsField.onChange(e.target.value)}
            onFocus={recastMonthsField.onFocus}
            onBlur={recastMonthsField.onBlur}
          />
        </label>
      </div>
    </div>
  );
};
