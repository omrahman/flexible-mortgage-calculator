import React, { useState } from 'react';
import { useInputField, useNumberField } from '../hooks';
import { MonthInput } from './MonthInput';
import { yearMonthToMonthNumber, monthNumberToYearMonth } from '../utils/calculations';
import type { ExtraItem, RecurringFrequency, MonthInput as MonthInputType } from '../types';
import { SegmentedControl } from './SegmentedControl';

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
    <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Payment #{paymentIndex}</h3>
        <button
          className="text-red-500 bg-red-100 hover:bg-red-200 rounded-full p-1.5 -mr-1.5 -mt-1.5"
          onClick={() => onRemoveExtra(extra.id)}
          aria-label="Remove payment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="space-y-4 pt-2">
        {/* Payment Details */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-600">Payment Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`amount-${extra.id}`} className="text-xs text-gray-500 block mb-2">Amount</label>
              <input
                id={`amount-${extra.id}`}
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
            <div className="space-y-2">
              <label className="text-xs text-gray-500 block mb-2">Payment Type</label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    name={`type-${extra.id}`}
                    value="payment"
                    checked={!extra.isForgiveness}
                    onChange={() => onUpdateExtra(extra.id, 'isForgiveness', false)}
                    className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                  />
                  <span>Extra Principal Payment</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    name={`type-${extra.id}`}
                    value="forgiveness"
                    checked={!!extra.isForgiveness}
                    onChange={() => onUpdateExtra(extra.id, 'isForgiveness', true)}
                    className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                  />
                  <span>Loan Forgiveness</span>
                </label>
              </div>
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
                      name={`frequency-${extra.id}`}
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
                      name={`frequency-${extra.id}`}
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
                <label htmlFor={`quantity-${extra.id}`} className="text-xs text-gray-500 block mb-2">Number of payments</label>
                <input
                  id={`quantity-${extra.id}`}
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
      </div>
    </div>
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
    <div className="rounded-2xl bg-white p-4 sm:p-5 shadow space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold">Extra Payments & Loan Forgiveness</h2>
      <p className="text-sm text-gray-600 leading-relaxed">
        Add extra principal payments or loan forgiveness amounts by month number or year/month. Use the checkbox to designate as forgiveness (reduces balance but doesn't count as principal paid) or extra payment (counts as principal paid). You can make payments recurring with a quantity and/or end date. If multiple payments land on the same month, they aggregate.
      </p>
      <div className="space-y-4">
        {extras.map((extra, index) => (
          <ExtraPaymentItem
            key={extra.id}
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
