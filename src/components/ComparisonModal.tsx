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
    { label: 'Loan Amount', key: 'loanAmount', format: 'usd' },
    { label: 'Original P&I', key: 'originalPI', format: 'usd' },
    { label: 'Current P&I', key: 'currentPI', format: 'usd' },
    { label: 'Original PITI', key: 'originalPITI', format: 'usd' },
    { label: 'Current PITI', key: 'currentPITI', format: 'usd' },
    { label: 'Payoff Date', key: 'payoffDate' },
    { label: 'Total Interest (Baseline)', key: 'totalInterestBaseline', format: 'usd' },
    { label: 'Total Interest (Current)', key: 'totalInterestCurrent', format: 'usd', lowerIsBetter: true },
    { label: 'Interest Saved', key: 'interestSaved', format: 'usd', higherIsBetter: true },
    { label: 'Months Saved', key: 'monthsSaved', higherIsBetter: true },
    { label: 'Total Paid', key: 'totalPaid', format: 'usd', lowerIsBetter: true },
    { label: 'Total Principal Paid', key: 'totalPrincipalPaid', format: 'usd' },
    { label: 'Total Extra Payments', key: 'totalExtraPayments', format: 'usd' },
    { label: 'Total Forgiveness', key: 'totalForgiveness', format: 'usd' },
    { label: "Lender's Profit", key: 'lenderProfit', format: 'usd' },
    { label: "Lender's ROI", key: 'lenderROI', format: 'percent' },
  ];

  const getBestValue = (key: string, higherIsBetter?: boolean, lowerIsBetter?: boolean) => {
    if (!higherIsBetter && !lowerIsBetter) return null;

    const values = configurations
      .map(c => c.summary?.[key as keyof typeof c.summary])
      .filter(v => typeof v === 'number') as number[];
    
    if (values.length === 0) return null;

    return higherIsBetter ? Math.max(...values) : Math.min(...values);
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
                      {metrics.map(({ label, key, format, higherIsBetter, lowerIsBetter }) => {
                        const bestValue = getBestValue(key, higherIsBetter, lowerIsBetter);

                        return (
                          <tr key={key} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white">{label}</td>
                            {configurations.map(c => {
                              const value = c.summary?.[key as keyof typeof c.summary];
                              const isBest = value === bestValue;

                              let displayValue = value;
                              if (typeof value === 'number') {
                                if (format === 'usd') displayValue = fmtUSD(value);
                                if (format === 'percent') displayValue = `${value.toFixed(2)}%`;
                              }

                              return (
                                <td key={c.id} className={`px-6 py-4 ${isBest ? 'bg-green-100 font-bold text-green-800' : ''}`}>
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
