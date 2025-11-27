'use client';

import { DailyUsage } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { formatBytes } from '@/lib/router/device-classifier';

interface UsageChartProps {
  data: DailyUsage[];
  className?: string;
}

export function UsageChart({ data, className }: UsageChartProps) {
  const chartData = data.map((daily) => ({
    date: format(new Date(daily.date), 'MMM dd'),
    download: daily.totalRx / (1024 * 1024), // Convert to MB
    upload: daily.totalTx / (1024 * 1024),
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
            label={{ value: 'MB', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => formatBytes(value * 1024 * 1024)}
          />
          <Legend />
          <Bar dataKey="download" fill="#3b82f6" name="Download" radius={[8, 8, 0, 0]} />
          <Bar dataKey="upload" fill="#10b981" name="Upload" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
