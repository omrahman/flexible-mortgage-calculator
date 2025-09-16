import React, { useState } from 'react';
import { useInputField, useNumberField } from '../hooks';
import { MonthInput } from './MonthInput';
import { yearMonthToMonthNumber, monthNumberToYearMonth } from '../utils/calculations';
import type { ForgivenessItem, RecurringFrequency, MonthInput as MonthInputType } from '../types';

interface ForgivenessPaymentsProps {
  forgiveness: ForgivenessItem[];
  termMonths: number;
  startYM: string;
  autoRecast: boolean;
  setAutoRecast: (value: boolean) => void;
  recastMonthsText: string;
  setRecastMonthsText: (value: string) => void;
  onAddForgiveness: () => void;
  onRemoveForgiveness: (id: string) => void;
  onUpdateForgiveness: (id: string, fieldOrUpdates: keyof ForgivenessItem | Partial<ForgivenessItem>, value?: number | boolean | RecurringFrequency) => void;
}

interface ForgivenessPaymentItemProps {
  forgiveness: ForgivenessItem;
  termMonths: number;
  startYM: string;
  onUpdateForgiveness: (id: string, fieldOrUpdates: keyof ForgivenessItem | Partial<ForgivenessItem>, value?: number | boolean | RecurringFrequency) => void;
  onRemoveForgiveness: (id: string) => void;
}

const ForgivenessPaymentItem: React.FC<ForgivenessPaymentItemProps> = ({ forgiveness, termMonths, startYM, onUpdateForgiveness, onRemoveForgiveness }) => {
  // Initialize monthInput state - use existing or create default
  const [monthInput, setMonthInput] = useState<MonthInputType>(() => 
    forgiveness.monthInput || {
      type: 'yearmonth',
      value: monthNumberToYearMonth(forgiveness.month, startYM)
    }
  );

  const handleMonthInputChange = (newMonthInput: MonthInputType) => {
    // Update local state
    setMonthInput(newMonthInput);
    
    // Update the stored monthInput
    onUpdateForgiveness(forgiveness.id, { monthInput: newMonthInput });
    
    // Convert to month number and update the actual month value
    let monthNumber: number;
    if (newMonthInput.type === 'number') {
      monthNumber = parseInt(newMonthInput.value, 10) || 1;
    } else {
      monthNumber = yearMonthToMonthNumber(newMonthInput.value, startYM);
    }
    
    // Ensure month number is within valid range
    monthNumber = Math.max(1, Math.min(monthNumber, termMonths));
    
    onUpdateForgiveness(forgiveness.id, 'month', monthNumber);
  };

  // Amount field hook
  const amountField = useNumberField({
    initialValue: forgiveness.amount,
    defaultValue: 1000,
    onValueChange: (value) => onUpdateForgiveness(forgiveness.id, 'amount', value),
    validate: (value) => value >= 0,
    min: 0
  });

  // Recurring quantity field hook
  const quantityField = useNumberField({
    initialValue: forgiveness.recurringQuantity || 1,
    defaultValue: 1,
    onValueChange: (value) => onUpdateForgiveness(forgiveness.id, 'recurringQuantity', value),
    validate: (value) => value >= 1,
    min: 1,
    max: forgiveness.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths
  });

  return (
    <div className="border rounded-xl p-3 sm:p-4 space-y-3">
       <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
         <div className="min-w-0">
           <span className="text-xs text-gray-500 block mb-2">Start</span>
           <MonthInput
             monthInput={monthInput}
             setMonthInput={handleMonthInputChange}
             startYM={startYM}
             termMonths={termMonths}
           />
         </div>
         <div className="min-w-0">
           <span className="text-xs text-gray-500 block mb-2">Amount</span>
           <input
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
       </div>
      
      {/* Recurring Payment Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(forgiveness.isRecurring)}
              onChange={(ev) => {
                const isChecked = ev.target.checked;
                if (isChecked) {
                  onUpdateForgiveness(forgiveness.id, 'isRecurring', true);
                } else {
                  // Reset all recurring fields when unchecked in a single update
                  onUpdateForgiveness(forgiveness.id, {
                    isRecurring: false,
                    recurringQuantity: 1,
                    recurringFrequency: 'monthly'
                  });
                }
              }}
            />
            <span className="text-sm font-medium">Make this a recurring forgiveness</span>
          </label>
          <button
            className="rounded-xl bg-red-600 text-white px-3 py-2 text-xs sm:text-sm hover:bg-red-700 whitespace-nowrap transition-colors"
            onClick={() => onRemoveForgiveness(forgiveness.id)}
          >
            Remove
          </button>
        </div>
        
        {Boolean(forgiveness.isRecurring) && (
          <div className="space-y-4">
            {/* Frequency Selection and Number of Payments */}
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 block mb-2">Forgiveness frequency</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`frequency-${forgiveness.id}`}
                      value="monthly"
                      checked={(forgiveness.recurringFrequency || 'monthly') === 'monthly'}
                      onChange={(ev) => {
                        onUpdateForgiveness(forgiveness.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
                      }}
                    />
                    <span className="text-sm">Monthly</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`frequency-${forgiveness.id}`}
                      value="annually"
                      checked={forgiveness.recurringFrequency === 'annually'}
                      onChange={(ev) => {
                        onUpdateForgiveness(forgiveness.id, 'recurringFrequency', ev.target.value as RecurringFrequency);
                      }}
                    />
                    <span className="text-sm">Annually</span>
                  </label>
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 block mb-2">
                  Number of forgiveness payments
                  {forgiveness.recurringFrequency === 'annually' && (
                    <span className="text-gray-400 ml-1">(years)</span>
                  )}
                </span>
                <input
                  className="w-full rounded-xl border p-2"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={forgiveness.recurringFrequency === 'annually' ? Math.ceil(termMonths / 12) : termMonths}
                  step="1"
                  value={quantityField.value}
                  onChange={(e) => quantityField.onChange(e.target.value)}
                  onFocus={quantityField.onFocus}
                  onBlur={quantityField.onBlur}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ForgivenessPayments: React.FC<ForgivenessPaymentsProps> = ({
  forgiveness,
  termMonths,
  startYM,
  autoRecast,
  setAutoRecast,
  recastMonthsText,
  setRecastMonthsText,
  onAddForgiveness,
  onRemoveForgiveness,
  onUpdateForgiveness,
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
      <h2 className="text-lg sm:text-xl font-semibold">Loan Forgiveness</h2>
      <p className="text-sm text-gray-600 leading-relaxed">
        Add loan forgiveness amounts by month number or year/month. These reduce your loan balance but do not count as principal paid. You can make forgiveness recurring with a quantity and/or end date. If multiple forgiveness amounts land on the same month, they aggregate.
      </p>
      <div className="space-y-4">
        {forgiveness.map((forgivenessItem) => (
          <ForgivenessPaymentItem
            key={forgivenessItem.id}
            forgiveness={forgivenessItem}
            termMonths={termMonths}
            startYM={startYM}
            onUpdateForgiveness={onUpdateForgiveness}
            onRemoveForgiveness={onRemoveForgiveness}
          />
        ))}
        <div>
          <button
            className="w-full rounded-xl bg-purple-600 text-white px-4 py-2 hover:bg-purple-700 transition-colors"
            onClick={onAddForgiveness}
          >
            Add Forgiveness Amount
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
