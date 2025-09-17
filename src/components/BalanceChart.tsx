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
                // Calculate total paid (interest + principal)
                const interestEntry = payload.find(entry => entry.dataKey === 'cumulativeInterest');
                const principalEntry = payload.find(entry => entry.dataKey === 'cumulativePrincipal');
                const totalPaid = (interestEntry ? Number(interestEntry.value) : 0) + 
                                 (principalEntry ? Number(principalEntry.value) : 0);
                
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-medium">{formatTooltipLabel(label)}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.dataKey === 'balance' ? 'Remaining Balance' : 
                         entry.dataKey === 'cumulativeInterest' ? 'Interest Paid' : 
                         entry.dataKey === 'cumulativePrincipal' ? 'Principal Paid' : 'Principal Forgiven'}: {fmtUSD(Number(entry.value))}
                      </p>
                    ))}
                    {/* Add Total Paid between Principal Paid and Forgiveness */}
                    {interestEntry && principalEntry && (
                      <p style={{ color: '#6b7280', fontWeight: 'bold' }}>
                        Total Paid: {fmtUSD(totalPaid)}
                      </p>
                    )}
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
          <Line 
            type="monotone" 
            dataKey="cumulativePrincipal" 
            dot={false} 
            strokeWidth={2} 
            stroke="#10b981"
            name="Principal Paid"
          />
          <Line 
            type="monotone" 
            dataKey="cumulativeForgiveness" 
            dot={false} 
            strokeWidth={2} 
            stroke="#8b5cf6"
            name="Principal Forgiven"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
