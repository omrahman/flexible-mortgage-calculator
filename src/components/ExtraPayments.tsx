import React, { useId, useState } from 'react';
import { useInputField, useNumberField } from '../hooks';
import { MonthInput } from './MonthInput';
import { yearMonthToMonthNumber, monthNumberToYearMonth } from '../utils/calculations';
import type { ExtraItem, RecurringFrequency, MonthInput as MonthInputType } from '../types';
import { SegmentedControl } from './SegmentedControl';
import { Accordion } from './Accordion';

interface ExtraPaymentsProps {
  extras: ExtraItem[];
  termMonths: number;
  startYM: string;
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
  startYM: string;
  onUpdateExtra: (id: string, fieldOrUpdates: keyof ExtraItem | Partial<ExtraItem>, value?: number | boolean | RecurringFrequency) => void;
  onRemoveExtra: (id: string) => void;
  paymentIndex: number;
}

const ExtraPaymentItem: React.FC<ExtraPaymentItemProps> = ({ extra, termMonths, startYM, onUpdateExtra, onRemoveExtra, paymentIndex }) => {
  const groupId = useId();
  // Initialize monthInput state - use existing or create default
  const [monthInput, setMonthInput] = useState<MonthInputType>(() => 
    extra.monthInput || {
      type: 'yearmonth',
      value: monthNumberToYearMonth(extra.month, startYM)
    }
  );

  const handleMonthInputChange = (newMonthInput: MonthInputType) => {
    // Update local state
    setMonthInput(newMonthInput);
    
    // Update the stored monthInput
    onUpdateExtra(extra.id, { monthInput: newMonthInput });
    
    // Convert to month number and update the actual month value
    let monthNumber: number;
    if (newMonthInput.type === 'number') {
      monthNumber = parseInt(newMonthInput.value, 10) || 1;
    } else {
      monthNumber = yearMonthToMonthNumber(newMonthInput.value, startYM);
    }
    
    // Ensure month number is within valid range
    monthNumber = Math.max(1, Math.min(monthNumber, termMonths));
    
    onUpdateExtra(extra.id, 'month', monthNumber);
  };

  // Amount field hook
  const amountField = useNumberField({
    initialValue: extra.amount,
    defaultValue: 1000,
    onValueChange: (value) => onUpdateExtra(extra.id, 'amount', value),
    validate: (value) => value >= 0,
    min: 0
  });

  // Recurring quantity field hook
  const quantityField = useNumberField({
    initialValue: extra.recurringQuantity || 1,
    defaultValue: 1,
    onValueChange: (value) => onUpdateExtra(extra.id, 'recurringQuantity', value),
    validate: (value) => value >= 1,
    min: 1,
    max: extra.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths
  });

  return (
    <Accordion
      title={`Payment #${paymentIndex}`}
      defaultOpen={paymentIndex === 1}
    >
      <div className="space-y-4 pt-2">
        {/* Payment Details */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-600">Payment Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`amount-${groupId}`} className="text-xs text-gray-500 block mb-2">Amount</label>
              <input
                id={`amount-${groupId}`}
                className="w-full rounded-xl border p-2 text-sm sm:text-base"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                step="100"
                value={amountField.value}
                onChange={(e) => amountField.onChange(e.target.value)}
                onFocus={amountField.onFocus}
                onBlur={amountField.onBlur}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <label className="text-xs text-gray-500 block mb-2">Payment Type</label>
              <SegmentedControl
                options={[
                  { value: 'principal', label: 'Extra Principal' },
                  { value: 'forgiveness', label: 'Forgiveness' },
                ]}
                value={extra.isForgiveness ? 'forgiveness' : 'principal'}
                onChange={(value) => {
                  onUpdateExtra(extra.id, 'isForgiveness', value === 'forgiveness');
                }}
                className="w-full"
              />
            </div>
          </div>
        </fieldset>

        {/* Payment Schedule */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-600">Payment Schedule</legend>
          <div>
            <span className="text-xs text-gray-500 block mb-2">Start</span>
            <MonthInput
              monthInput={monthInput}
              setMonthInput={handleMonthInputChange}
              startYM={startYM}
              termMonths={termMonths}
            />
          </div>
          <SegmentedControl
            options={[
              { value: 'one-time', label: 'One-time' },
              { value: 'recurring', label: 'Recurring' },
            ]}
            value={extra.isRecurring ? 'recurring' : 'one-time'}
            onChange={(value) => {
              const isRecurring = value === 'recurring';
              if (isRecurring) {
                onUpdateExtra(extra.id, 'isRecurring', true);
              } else {
                onUpdateExtra(extra.id, {
                  isRecurring: false,
                  recurringQuantity: 1,
                  recurringFrequency: 'monthly'
                });
              }
            }}
          />
          {extra.isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-gray-500 block mb-2">Payment frequency</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      name={`frequency-${groupId}`}
                      value="monthly"
                      checked={extra.recurringFrequency === 'monthly'}
                      onChange={() => onUpdateExtra(extra.id, 'recurringFrequency', 'monthly')}
                      className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span>Monthly</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="radio"
                      name={`frequency-${groupId}`}
                      value="annually"
                      checked={extra.recurringFrequency === 'annually'}
                      onChange={() => onUpdateExtra(extra.id, 'recurringFrequency', 'annually')}
                      className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span>Annually</span>
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor={`quantity-${groupId}`} className="text-xs text-gray-500 block mb-2">Number of payments</label>
                <input
                  id={`quantity-${groupId}`}
                  className="w-full rounded-xl border p-2 text-sm sm:text-base"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  step="1"
                  value={quantityField.value}
                  onChange={(e) => quantityField.onChange(e.target.value)}
                  onFocus={quantityField.onFocus}
                  onBlur={quantityField.onBlur}
                />
              </div>
            </div>
          )}
        </fieldset>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => onRemoveExtra(extra.id)}
            className="w-full rounded-xl bg-red-100 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-200"
          >
            Remove Payment
          </button>
        </div>
      </div>
    </Accordion>
  );
};

export const ExtraPayments: React.FC<ExtraPaymentsProps> = ({
  extras,
  termMonths,
  startYM,
  autoRecast,
  setAutoRecast,
  recastMonthsText,
  setRecastMonthsText,
  onAddExtra,
  onRemoveExtra,
  onUpdateExtra,
}) => {
  // Recast months text field hook
  const recastMonthsField = useInputField({
    initialValue: recastMonthsText,
    defaultValue: '',
    onValueChange: setRecastMonthsText,
    validate: () => true, // Allow any text input for recast months
    allowEmpty: true
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 leading-relaxed">
        Add extra principal payments or loan forgiveness amounts by month number or year/month. Use the checkbox to designate as forgiveness (reduces balance but doesn't count as principal paid) or extra payment (counts as principal paid). You can make payments recurring with a quantity and/or end date. If multiple payments land on the same month, they aggregate.
      </p>
      <div className="space-y-4">
        {extras.map((extra, index) => (
          <ExtraPaymentItem
            key={`${extra.id}-${index}`}
            extra={extra}
            termMonths={termMonths}
            startYM={startYM}
            onUpdateExtra={onUpdateExtra}
            onRemoveExtra={onRemoveExtra}
            paymentIndex={index + 1}
          />
        ))}
        <div>
          <button
            className="w-full rounded-xl bg-black text-white px-4 py-2"
            onClick={onAddExtra}
          >
            Add Payment
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
          <span>Recast automatically after any month with an extra payment or forgiveness</span>
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
