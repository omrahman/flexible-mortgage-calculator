import React, { useState, useEffect } from 'react';
import { SegmentedControl } from './SegmentedControl';
import { monthNumberToYearMonth, yearMonthToMonthNumber } from '../utils/calculations';
import type { MonthInput as MonthInputType } from '../types';

interface MonthInputProps {
  monthInput: MonthInputType;
  setMonthInput: (value: MonthInputType) => void;
  startYM: string;
  termMonths: number;
  className?: string;
}

export const MonthInput: React.FC<MonthInputProps> = ({
  monthInput,
  setMonthInput,
  startYM,
  termMonths,
  className = '',
}) => {
  // Local state for the input value
  const [inputValue, setInputValue] = useState(monthInput.value);

  // Calculate min and max dates for the month picker
  const minDate = startYM; // Loan start date
  const maxDate = monthNumberToYearMonth(termMonths, startYM); // Loan end date

  // Update local state when prop changes
  useEffect(() => {
    setInputValue(monthInput.value);
  }, [monthInput.value]);

  // Handle input value changes
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setMonthInput({ ...monthInput, value });
  };

  // Handle type changes
  const handleTypeChange = (type: string) => {
    if (type === monthInput.type) {
      return;
    }

    let newValue: string;
    
    if (type === 'number') {
      // Converting from Year/Month to month number
      if (inputValue && /^\d{4}-\d{2}$/.test(inputValue)) {
        const monthNumber = yearMonthToMonthNumber(inputValue, startYM);
        newValue = monthNumber >= 1 && monthNumber <= termMonths ? monthNumber.toString() : '1';
      } else {
        newValue = '1';
      }
    } else {
      // Converting from month number to Year/Month
      if (inputValue && /^\d+$/.test(inputValue)) {
        const monthNumber = parseInt(inputValue, 10);
        if (monthNumber >= 1 && monthNumber <= termMonths) {
          newValue = monthNumberToYearMonth(monthNumber, startYM);
        } else {
          newValue = startYM;
        }
      } else {
        newValue = startYM;
      }
    }

    setInputValue(newValue);
    setMonthInput({
      type: type as 'number' | 'yearmonth',
      value: newValue,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <SegmentedControl
        options={[
          { value: 'yearmonth', label: 'Year/Month' },
          { value: 'number', label: 'Month #' },
        ]}
        value={monthInput.type}
        onChange={handleTypeChange}
        className="w-full"
      />
      <div className="relative">
        <input
          className="w-full rounded-xl border p-2 text-sm sm:text-base"
          type={monthInput.type === 'number' ? 'tel' : 'month'}
          inputMode={monthInput.type === 'number' ? 'numeric' : undefined}
          pattern={monthInput.type === 'number' ? '[0-9]*' : undefined}
          min={monthInput.type === 'number' ? 1 : minDate}
          max={monthInput.type === 'number' ? termMonths : maxDate}
          step={monthInput.type === 'number' ? '1' : undefined}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
        />
        {monthInput.type === 'yearmonth' && (
          <div className="text-xs text-gray-500 mt-1">
            Available: {minDate} to {maxDate}
          </div>
        )}
      </div>
    </div>
  );
};