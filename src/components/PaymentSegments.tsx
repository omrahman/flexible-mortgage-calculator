import React from 'react';
import { fmtUSD } from '../utils/formatters';
import type { ScheduleResult } from '../types';

interface PaymentSegmentsProps {
  baseline: ScheduleResult;
  result: ScheduleResult;
  monthlyPITI: { propertyTax: number; insurance: number; total: number };
}

export const PaymentSegments: React.FC<PaymentSegmentsProps> = ({
  baseline,
  result,
  monthlyPITI,
}) => {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Payment Segments</h2>
      <p className="text-sm text-gray-600 mb-6">
        Track how your monthly payment changes over time with recasting and extra payments.
      </p>
      
      <div className="space-y-3">
        {result.segments.map((s, i) => {
          const totalPITI = s.payment + monthlyPITI.total;
          const isLast = i === result.segments.length - 1;
          const endMonth = isLast ? result.payoffMonth : result.segments[i + 1]?.start - 1;
          
          return (
            <div key={i} className="border rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Month {s.start}
                      {endMonth && endMonth !== s.start && ` - ${endMonth}`}
                      {isLast && ' (final)'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({endMonth ? endMonth - s.start + 1 : 1} month{endMonth ? 's' : ''})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">P&I Payment:</span>
                        <span className="font-medium">{fmtUSD(s.payment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Tax:</span>
                        <span className="font-medium">{fmtUSD(monthlyPITI.propertyTax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Insurance:</span>
                        <span className="font-medium">{fmtUSD(monthlyPITI.insurance)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between border-t pt-1">
                        <span className="font-semibold text-gray-800">Total PITI:</span>
                        <span className="font-semibold text-green-600 text-lg">{fmtUSD(totalPITI)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {s.payment !== baseline.segments[0]?.payment && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Recast
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
