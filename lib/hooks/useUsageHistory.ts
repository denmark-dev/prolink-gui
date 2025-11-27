'use client';

import { useState, useEffect } from 'react';
import { UsageSnapshot, TimeRange, DailyUsage } from '../types';
import { getUsageHistory, calculateDailyUsage } from '../firestore/device-stats';
import { startOfDay, subDays, format } from 'date-fns';

export function useUsageHistory(mac: string, timeRange: TimeRange = 'today') {
  const [snapshots, setSnapshots] = useState<UsageSnapshot[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      const now = new Date();
      let startTime: Date;
      let days: number;

      switch (timeRange) {
        case 'today':
          startTime = startOfDay(now);
          days = 1;
          break;
        case '7days':
          startTime = subDays(startOfDay(now), 6);
          days = 7;
          break;
        case '30days':
          startTime = subDays(startOfDay(now), 29);
          days = 30;
          break;
      }

      try {
        // Fetch usage snapshots
        const history = await getUsageHistory(
          mac,
          startTime.getTime(),
          now.getTime()
        );
        setSnapshots(history);

        // Calculate daily aggregations
        const dailyData: DailyUsage[] = [];
        for (let i = 0; i < days; i++) {
          const date = subDays(startOfDay(now), days - 1 - i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const usage = await calculateDailyUsage(mac, dateStr);
          if (usage) {
            dailyData.push(usage);
          }
        }
        setDailyUsage(dailyData);
      } catch (error) {
        console.error('Failed to fetch usage history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [mac, timeRange]);

  return { snapshots, dailyUsage, loading };
}
