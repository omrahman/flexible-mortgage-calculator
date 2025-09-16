import React from 'react';
import { SegmentedControl } from './SegmentedControl';
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
  onReset,
}) => {
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

  const handleDownPaymentTypeChange = (type: string) => {
    const homePriceNum = parseFloat(homePrice) || 0;
    const currentValue = parseFloat(downPayment.value) || 0;
    
    // Don't convert if we're already in the target type
    if (type === downPayment.type) {
      return;
    }
    
    let newValue: string;
    
    if (type === 'percentage') {
      // Converting from dollar amount to percentage
      if (homePriceNum > 0) {
        const percentage = (currentValue / homePriceNum) * 100;
        newValue = percentage > 0 ? percentage.toFixed(1) : '0';
      } else {
        newValue = '20'; // Default percentage
      }
    } else {
      // Converting from percentage to dollar amount
      if (homePriceNum > 0) {
        const dollarAmount = homePriceNum * (currentValue / 100);
        newValue = Math.round(dollarAmount).toString();
      } else {
        newValue = '200000'; // Default dollar amount
      }
    }
    
    setDownPayment({
      ...downPayment,
      type: type as 'percentage' | 'dollar',
      value: newValue,
    });
  };

  const handleDownPaymentValueChange = (value: string) => {
    setDownPayment({
      ...downPayment,
      value,
    });
  };
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Loan</h2>
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
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2">
          <span className="text-sm text-gray-600">Home Price</span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min={0}
            step="1000"
            value={homePrice}
            onChange={(e) => setHomePrice(e.target.value)}
          />
        </label>
        
        <label className="col-span-2">
          <span className="text-sm text-gray-600 mb-2 block">Down Payment</span>
          <div className="space-y-3">
            <SegmentedControl
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'dollar', label: 'Dollar Amount' },
              ]}
              value={downPayment.type}
              onChange={handleDownPaymentTypeChange}
            />
            <div className="relative">
              <input
                className="w-full rounded-xl border p-2 pr-8"
                type="number"
                min={0}
                step={downPayment.type === 'percentage' ? '0.1' : '1000'}
                value={downPayment.value}
                onChange={(e) => handleDownPaymentValueChange(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {downPayment.type === 'percentage' ? '%' : '$'}
              </span>
            </div>
          </div>
        </label>

        <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Home Price:</span>
              <span className="font-medium">${parseFloat(homePrice || '0').toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Down Payment:</span>
              <span className="font-medium">
                {downPayment.type === 'percentage' 
                  ? `${downPayment.value}% ($${Math.round((parseFloat(homePrice || '0') * parseFloat(downPayment.value || '0')) / 100).toLocaleString()})`
                  : `$${parseFloat(downPayment.value || '0').toLocaleString()} (${parseFloat(homePrice || '0') > 0 ? ((parseFloat(downPayment.value || '0') / parseFloat(homePrice || '0')) * 100).toFixed(1) : '0'}%)`
                }
              </span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-semibold">Loan Amount:</span>
              <span className="font-semibold text-blue-600">${Math.round(loanAmount).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <label>
          <span className="text-sm text-gray-600">Rate (APR %)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <label>
          <span className="text-sm text-gray-600">Term (years)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min={1}
            step="1"
            value={termYears}
            onChange={(e) => setTermYears(e.target.value)}
          />
        </label>
        <label className="col-span-2">
          <span className="text-sm text-gray-600">Start (YYYY-MM)</span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="month"
            value={startYM}
            onChange={(e) => setStartYM(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
};
