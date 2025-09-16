import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { fmtUSD } from '../utils/formatters';
import type { ScheduleResult } from '../types';
import { CHART_HEIGHT } from '../constants';

interface BalanceChartProps {
  chartData: ScheduleResult['chart'];
}

export const BalanceChart: React.FC<BalanceChartProps> = ({ chartData }) => {
  const formatTooltipLabel = (label: string) => {
    const [monthNum, date] = label.split('\n');
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${year} (Month ${monthNum})`;
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-xl font-semibold mb-4">Balance Over Time</h2>
      <div style={{ height: CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis 
              tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
              domain={[0, 'dataMax']} 
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-medium">{formatTooltipLabel(label)}</p>
                      {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.dataKey === 'balance' ? 'Remaining Balance' : 'Interest Paid'}: {fmtUSD(Number(entry.value))}
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              dot={false} 
              strokeWidth={2} 
              stroke="#3b82f6"
              name="Remaining Balance"
            />
            <Line 
              type="monotone" 
              dataKey="cumulativeInterest" 
              dot={false} 
              strokeWidth={2} 
              stroke="#ef4444"
              name="Interest Paid"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
