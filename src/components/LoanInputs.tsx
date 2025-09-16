import React from 'react';
import { SegmentedControl } from './SegmentedControl';
import { useInputField } from '../hooks';
import type { DownPaymentInput } from '../types';

interface LoanInputsProps {
  homePrice: string;
  setHomePrice: (value: string) => void;
  downPayment: DownPaymentInput;
  setDownPayment: (value: DownPaymentInput) => void;
  rate: string;
  setRate: (value: string) => void;
  termYears: string;
  setTermYears: (value: string) => void;
  startYM: string;
  setStartYM: (value: string) => void;
  propertyTaxAnnual: string;
  setPropertyTaxAnnual: (value: string) => void;
  insuranceAnnual: string;
  setInsuranceAnnual: (value: string) => void;
  onReset?: () => void;
}

export const LoanInputs: React.FC<LoanInputsProps> = ({
  homePrice,
  setHomePrice,
  downPayment,
  setDownPayment,
  rate,
  setRate,
  termYears,
  setTermYears,
  startYM,
  setStartYM,
  propertyTaxAnnual,
  setPropertyTaxAnnual,
  insuranceAnnual,
  setInsuranceAnnual,
  onReset,
}) => {
  // Use the input field hook for all text inputs
  const homePriceField = useInputField({
    initialValue: homePrice,
    defaultValue: '1000000',
    onValueChange: setHomePrice,
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  });

  const rateField = useInputField({
    initialValue: rate,
    defaultValue: '4.85',
    onValueChange: setRate,
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  });

  const termYearsField = useInputField({
    initialValue: termYears,
    defaultValue: '30',
    onValueChange: setTermYears,
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 1)
  });

  const propertyTaxField = useInputField({
    initialValue: propertyTaxAnnual,
    defaultValue: '12000',
    onValueChange: setPropertyTaxAnnual,
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  });

  const insuranceField = useInputField({
    initialValue: insuranceAnnual,
    defaultValue: '2400',
    onValueChange: setInsuranceAnnual,
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  });

  // Calculate loan amount based on home price and down payment
  const calculateLoanAmount = () => {
    const homePriceNum = parseFloat(homePrice) || 0;
    const downPaymentValue = parseFloat(downPayment.value) || 0;
    
    if (downPayment.type === 'percentage') {
      return homePriceNum * (1 - downPaymentValue / 100);
    } else {
      return Math.max(0, homePriceNum - downPaymentValue);
    }
  };

  const loanAmount = calculateLoanAmount();

  // Down payment field hook
  const downPaymentField = useInputField({
    initialValue: downPayment.value,
    defaultValue: downPayment.type === 'percentage' ? '20' : '200000',
    onValueChange: (value) => setDownPayment({ ...downPayment, value }),
    validate: (value) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  });

  const handleDownPaymentTypeChange = (type: string) => {
    // Don't convert if we're already in the target type
    if (type === downPayment.type) {
      return;
    }
    
    const homePriceNum = parseFloat(homePrice) || 0;
    const currentValue = parseFloat(downPayment.value) || 0;
    
    let newValue: string;
    
    if (type === 'percentage') {
      // Converting from dollar amount to percentage
      if (homePriceNum > 0 && currentValue > 0) {
        const percentage = (currentValue / homePriceNum) * 100;
        newValue = percentage > 0 ? percentage.toFixed(1) : '0';
      } else {
        // Only set default if we're not in the middle of typing
        newValue = homePriceField.isFocused ? '0' : '20';
      }
    } else {
      // Converting from percentage to dollar amount
      if (homePriceNum > 0 && currentValue > 0) {
        const dollarAmount = homePriceNum * (currentValue / 100);
        newValue = Math.round(dollarAmount).toString();
      } else {
        // Only set default if we're not in the middle of typing
        newValue = homePriceField.isFocused ? '0' : '200000';
      }
    }
    
    setDownPayment({
      ...downPayment,
      type: type as 'percentage' | 'dollar',
      value: newValue,
    });
  };
  return (
    <div className="rounded-2xl bg-white p-3 sm:p-4 lg:p-5 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Loan</h2>
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Reset all inputs to defaults"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <label className="col-span-1 sm:col-span-2">
          <span className="text-sm text-gray-600">Home Price</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            step="1000"
            value={homePriceField.value}
            onChange={(e) => homePriceField.onChange(e.target.value)}
            onFocus={homePriceField.onFocus}
            onBlur={homePriceField.onBlur}
          />
        </label>
        
        <label className="col-span-1 sm:col-span-2">
          <span className="text-sm text-gray-600 mb-2 block">Down Payment</span>
          <div className="space-y-3">
            <SegmentedControl
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'dollar', label: 'Dollar Amount' },
              ]}
              value={downPayment.type}
              onChange={handleDownPaymentTypeChange}
              className="w-full"
            />
            <div className="relative">
              <input
                className="w-full rounded-xl border p-2 pr-8 text-sm sm:text-base"
                type="tel"
                inputMode="decimal"
                pattern={downPayment.type === 'percentage' ? '[0-9]*\\.?[0-9]*' : '[0-9]*'}
                min={0}
                step={downPayment.type === 'percentage' ? '0.1' : '1000'}
                value={downPaymentField.value}
                onChange={(e) => downPaymentField.onChange(e.target.value)}
                onFocus={downPaymentField.onFocus}
                onBlur={downPaymentField.onBlur}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {downPayment.type === 'percentage' ? '%' : '$'}
              </span>
            </div>
          </div>
        </label>

        <div className="col-span-1 sm:col-span-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-600 space-y-1">
            <div className="flex justify-between gap-2">
              <span className="flex-shrink-0">Home Price:</span>
              <span className="font-medium text-right break-words">${parseFloat(homePrice || '0').toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="flex-shrink-0">Down Payment:</span>
              <span className="font-medium text-right break-words">
                {downPayment.type === 'percentage' 
                  ? `${downPayment.value}% ($${Math.round((parseFloat(homePrice || '0') * parseFloat(downPayment.value || '0')) / 100).toLocaleString()})`
                  : `$${parseFloat(downPayment.value || '0').toLocaleString()} (${parseFloat(homePrice || '0') > 0 ? ((parseFloat(downPayment.value || '0') / parseFloat(homePrice || '0')) * 100).toFixed(1) : '0'}%)`
                }
              </span>
            </div>
            <div className="flex justify-between border-t pt-1 gap-2">
              <span className="font-semibold flex-shrink-0">Loan Amount:</span>
              <span className="font-semibold text-blue-600 text-right break-words">${Math.round(loanAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>


        <label>
          <span className="text-sm text-gray-600">Rate (APR %)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="tel"
            inputMode="decimal"
            pattern="[0-9]*\\.?[0-9]*"
            min={0}
            step="0.01"
            value={rateField.value}
            onChange={(e) => rateField.onChange(e.target.value)}
            onFocus={rateField.onFocus}
            onBlur={rateField.onBlur}
          />
        </label>
        <label>
          <span className="text-sm text-gray-600">Term (years)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            step="1"
            value={termYearsField.value}
            onChange={(e) => termYearsField.onChange(e.target.value)}
            onFocus={termYearsField.onFocus}
            onBlur={termYearsField.onBlur}
          />
        </label>
        <label>
          <span className="text-sm text-gray-600">Property Tax (annual)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            step="100"
            value={propertyTaxField.value}
            onChange={(e) => propertyTaxField.onChange(e.target.value)}
            onFocus={propertyTaxField.onFocus}
            onBlur={propertyTaxField.onBlur}
          />
        </label>
        <label>
          <span className="text-sm text-gray-600">Insurance (annual)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            step="100"
            value={insuranceField.value}
            onChange={(e) => insuranceField.onChange(e.target.value)}
            onFocus={insuranceField.onFocus}
            onBlur={insuranceField.onBlur}
          />
        </label>
        <label className="col-span-1 sm:col-span-2">
          <span className="text-sm text-gray-600">Start</span>
          <input
            className="mt-1 w-full rounded-xl border p-2 text-sm sm:text-base"
            type="month"
            value={startYM}
            onChange={(e) => setStartYM(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};
