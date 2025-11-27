'use client';

import { useState, useEffect, useRef } from 'react';
import { BatteryStats, BatteryDailyUsage } from '../types';
import { 
  getBatteryStats, 
  updateBatteryStats,
  getWeeklyBatteryUsage,
  getMonthlyBatteryUsage 
} from '../firestore/battery-tracking';

interface UseBatteryTrackingOptions {
  enableFirestore?: boolean;
  currentLevel: number;
  isCharging: boolean;
  routerUptime?: number; // Uptime in seconds from router
}

export function useBatteryTracking(options: UseBatteryTrackingOptions) {
  const { enableFirestore = false, currentLevel, isCharging, routerUptime = 0 } = options;

  const [stats, setStats] = useState<BatteryStats>({
    currentLevel: 0,
    isCharging: false,
    currentSessionDuration: 0,
    todayDuration: 0,
    weeklyDuration: 0,
    monthlyDuration: 0,
    averageDailyDuration: 0,
  });

  const [weeklyUsage, setWeeklyUsage] = useState<BatteryDailyUsage[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<BatteryDailyUsage[]>([]);
  const [loading, setLoading] = useState(true);

  // Track session start time
  const sessionStartRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastRouterUptimeRef = useRef<number>(0);

  // Live duration counter - use router uptime directly
  const [liveDuration, setLiveDuration] = useState(routerUptime);

  // Update live duration when router uptime changes
  useEffect(() => {
    if (routerUptime > 0) {
      setLiveDuration(routerUptime);
      lastRouterUptimeRef.current = routerUptime;
    }
  }, [routerUptime]);

  // Increment duration every second between router updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load initial stats from Firestore
  useEffect(() => {
    if (!enableFirestore) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadStats = async () => {
      try {
        const [batteryStats, weekly, monthly] = await Promise.all([
          getBatteryStats(),
          getWeeklyBatteryUsage(),
          getMonthlyBatteryUsage(),
        ]);

        if (mounted) {
          if (batteryStats) {
            setStats(batteryStats);
            // If there's an active session, calculate live duration
            if (batteryStats.sessionStartTime) {
              const duration = Math.floor((Date.now() - batteryStats.sessionStartTime) / 1000);
              setLiveDuration(duration);
              sessionStartRef.current = batteryStats.sessionStartTime;
            }
          }
          setWeeklyUsage(weekly);
          setMonthlyUsage(monthly);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useBatteryTracking] Error loading stats:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [enableFirestore]);

  // Update stats periodically
  useEffect(() => {
    if (!enableFirestore) return;

    const saveInterval = setInterval(async () => {
      try {
        const now = Date.now();
        const sessionDuration = sessionStartRef.current 
          ? Math.floor((now - sessionStartRef.current) / 1000)
          : 0;

        // Calculate duration since last update
        const durationSinceLastUpdate = Math.floor((now - lastUpdateRef.current) / 1000);
        lastUpdateRef.current = now;

        await updateBatteryStats({
          currentLevel,
          isCharging,
          currentSessionDuration: sessionDuration,
          sessionStartTime: sessionStartRef.current || undefined,
          todayDuration: durationSinceLastUpdate,
          weeklyDuration: durationSinceLastUpdate,
          monthlyDuration: durationSinceLastUpdate,
        });

        // Reload stats
        const [batteryStats, weekly, monthly] = await Promise.all([
          getBatteryStats(),
          getWeeklyBatteryUsage(),
          getMonthlyBatteryUsage(),
        ]);

        if (batteryStats) {
          setStats(batteryStats);
        }
        setWeeklyUsage(weekly);
        setMonthlyUsage(monthly);

        console.log('[useBatteryTracking] Stats updated');
      } catch (error) {
        console.error('[useBatteryTracking] Error saving stats:', error);
      }
    }, 300000); // Save every 5 minutes

    return () => clearInterval(saveInterval);
  }, [enableFirestore, currentLevel, isCharging]);

  return {
    stats: {
      ...stats,
      currentLevel,
      isCharging,
      currentSessionDuration: liveDuration,
    },
    weeklyUsage,
    monthlyUsage,
    loading,
  };
}
