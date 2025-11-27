'use client';

import { UsageSnapshot } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { formatSpeed } from '@/lib/router/device-classifier';

interface SpeedChartProps {
  data: UsageSnapshot[];
  className?: string;
}

export function SpeedChart({ data, className }: SpeedChartProps) {
  const chartData = data.map((snapshot) => ({
    time: format(new Date(snapshot.timestamp), 'HH:mm:ss'),
    download: snapshot.downloadSpeed / 1024, // Convert to KB/s
    upload: snapshot.uploadSpeed / 1024,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor' }}
            label={{ value: 'KB/s', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => formatSpeed(value * 1024)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="download"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Download"
            animationDuration={300}
          />
          <Line
            type="monotone"
            dataKey="upload"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Upload"
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
