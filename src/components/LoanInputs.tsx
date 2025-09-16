import React from 'react';

interface LoanInputsProps {
  principal: string;
  setPrincipal: (value: string) => void;
  rate: string;
  setRate: (value: string) => void;
  termYears: string;
  setTermYears: (value: string) => void;
  startYM: string;
  setStartYM: (value: string) => void;
  onReset?: () => void;
}

export const LoanInputs: React.FC<LoanInputsProps> = ({
  principal,
  setPrincipal,
  rate,
  setRate,
  termYears,
  setTermYears,
  startYM,
  setStartYM,
  onReset,
}) => {
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
          <span className="text-sm text-gray-600">Principal</span>
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min={0}
            step="1000"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
          />
        </label>
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
