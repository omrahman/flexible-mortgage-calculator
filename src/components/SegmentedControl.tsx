import React from 'react';

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex rounded-lg border border-gray-300 bg-gray-50 p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-3 py-2 sm:py-1 text-sm font-medium rounded-md transition-all duration-200 min-h-[44px] sm:min-h-0 ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
