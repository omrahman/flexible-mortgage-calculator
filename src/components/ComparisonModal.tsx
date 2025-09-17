import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { SavedConfiguration } from '../types';
import { fmtUSD } from '../utils/formatters';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  configurations: SavedConfiguration[];
}

export function ComparisonModal({ isOpen, onClose, configurations }: ComparisonModalProps) {
  if (!isOpen) {
    return null;
  }

  const metrics = [
    { label: 'Loan Amount', key: 'loanAmount', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Original P&I', key: 'originalPI', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Current P&I', key: 'currentPI', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Original PITI', key: 'originalPITI', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Current PITI', key: 'currentPITI', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Payoff Date', key: 'payoffDate' },
    { label: 'Total Interest (Baseline)', key: 'totalInterestBaseline', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Total Interest (Current)', key: 'totalInterestCurrent', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Interest Saved', key: 'interestSaved', format: 'usd', comparison: 'higherIsBetter' },
    { label: 'Months Saved', key: 'monthsSaved', comparison: 'higherIsBetter' },
    { label: 'Total Paid', key: 'totalPaid', format: 'usd', comparison: 'lowerIsBetter' },
    { label: 'Total Principal Paid', key: 'totalPrincipalPaid', format: 'usd' },
    { label: 'Total Extra Payments', key: 'totalExtraPayments', format: 'usd' },
    { label: 'Total Forgiveness', key: 'totalForgiveness', format: 'usd' },
    { label: "Lender's Profit", key: 'lenderProfit', format: 'usd' },
    { label: "Lender's ROI", key: 'lenderROI', format: 'percent', comparison: 'higherIsBetter' },
  ] as const;

  const getBestValue = (key: string, comparison?: 'higherIsBetter' | 'lowerIsBetter') => {
    if (!comparison) return null;

    const values = configurations
      .map(c => c.summary?.[key as keyof typeof c.summary])
      .filter(v => typeof v === 'number') as number[];
    
    if (values.length === 0) return null;

    return comparison === 'higherIsBetter' ? Math.max(...values) : Math.min(...values);
  };

  const getHighlightStyle = (value: number, allValues: number[], comparison?: 'higherIsBetter' | 'lowerIsBetter'): React.CSSProperties => {
    if (allValues.length < 2 || !comparison) return {};

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (max === min) return {};

    // Normalize value to a 0-1 scale (0 = worst, 1 = best)
    let score = (value - min) / (max - min);
    if (comparison === 'lowerIsBetter') {
      score = 1 - score;
    }

    // Don't color the worst value, just the ones better than it
    if (score < 0.01) return {};

    // Use HSL for easy color manipulation.
    // Hue 130 is a nice green.
    // Saturation is fixed.
    // Lightness will range from 95% (almost white) for the best to lighter for others.
    const lightness = 95 - (score * 20); // 75% for best, up to 95%
    
    return { 
      backgroundColor: `hsl(130, 80%, ${lightness}%)`,
      fontWeight: score > 0.99 ? 'bold' : 'normal',
    };
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                <Dialog.Title
                  as="h2"
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Compare Scenarios
                </Dialog.Title>
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-50">Metric</th>
                        {configurations.map(c => (
                          <th key={c.id} scope="col" className="px-6 py-3">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map(({ label, key, format, comparison }) => {
                        const bestValue = getBestValue(key, comparison);
                        const allValues = configurations
                          .map(c => c.summary?.[key as keyof typeof c.summary])
                          .filter(v => typeof v === 'number') as number[];

                        return (
                          <tr key={key} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white">{label}</td>
                            {configurations.map(c => {
                              const value = c.summary?.[key as keyof typeof c.summary];
                              const isNumeric = typeof value === 'number';
                              
                              let style = {};
                              if (isNumeric && comparison) {
                                style = getHighlightStyle(value as number, allValues, comparison);
                              }

                              let displayValue = value;
                              if (isNumeric) {
                                if (format === 'usd') displayValue = fmtUSD(value as number);
                                if (format === 'percent') displayValue = `${(value as number).toFixed(2)}%`;
                              }

                              return (
                                <td key={c.id} className="px-6 py-4" style={style}>
                                  {displayValue ?? 'N/A'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
