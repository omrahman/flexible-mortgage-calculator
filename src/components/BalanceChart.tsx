import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtUSD } from '../utils/formatters';
import type { ScheduleResult } from '../types';
import { CHART_HEIGHT } from '../constants';

interface BalanceChartProps {
  chartData: ScheduleResult['chart'];
}

export const BalanceChart: React.FC<BalanceChartProps> = ({ chartData }) => {
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
              formatter={(v: any) => fmtUSD(v as number)} 
              labelFormatter={(l) => `Month ${l.split("\n")[0]}`} 
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              dot={false} 
              strokeWidth={2} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
