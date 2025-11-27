'use client';

import { useState, useEffect, useRef } from 'react';
import { getAllUsagePeriods, saveHotspotUsage, UsagePeriod } from '../firestore/hotspot-usage';

interface UseHotspotUsageOptions {
  enableFirestore?: boolean;
  totalDownloaded: number;
  totalUploaded: number;
  peakDownloadSpeed: number;
  peakUploadSpeed: number;
  deviceCount: number;
}

export function useHotspotUsage(options: UseHotspotUsageOptions) {
  const {
    enableFirestore = false,
    totalDownloaded,
    totalUploaded,
    peakDownloadSpeed,
    peakUploadSpeed,
    deviceCount,
  } = options;

  const [usage, setUsage] = useState<UsagePeriod>({
    daily: null,
    weekly: 0,
    monthly: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Track the baseline values at the start of the day
  const dayStartRef = useRef<{ date: string; downloaded: number; uploaded: number } | null>(null);

  useEffect(() => {
    if (!enableFirestore) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUsage = async () => {
      try {
        const periods = await getAllUsagePeriods();
        if (mounted) {
          setUsage(periods);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useHotspotUsage] Error fetching usage:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchUsage();

    // Refresh every 30 seconds
    const intervalId = setInterval(fetchUsage, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [enableFirestore]);

  // Save usage data periodically
  useEffect(() => {
    if (!enableFirestore) return;

    const today = new Date().toISOString().split('T')[0];
    
    // Initialize baseline if it's a new day or first run
    if (!dayStartRef.current || dayStartRef.current.date !== today) {
      dayStartRef.current = {
        date: today,
        downloaded: totalDownloaded,
        uploaded: totalUploaded,
      };
      console.log('[useHotspotUsage] New day detected, baseline set:', dayStartRef.current);
    }

    const saveInterval = setInterval(async () => {
      try {
        // Calculate today's usage as increment from baseline
        const dailyDownloaded = totalDownloaded - dayStartRef.current!.downloaded;
        const dailyUploaded = totalUploaded - dayStartRef.current!.uploaded;
        
        await saveHotspotUsage(
          Math.max(0, dailyDownloaded), // Ensure non-negative
          Math.max(0, dailyUploaded),
          peakDownloadSpeed,
          peakUploadSpeed,
          deviceCount
        );
        console.log('[useHotspotUsage] Saved daily usage:', {
          downloaded: dailyDownloaded,
          uploaded: dailyUploaded,
        });
      } catch (error) {
        console.error('[useHotspotUsage] Error saving usage:', error);
      }
    }, 300000); // Save every 5 minutes to conserve Firestore quota

    return () => clearInterval(saveInterval);
  }, [enableFirestore, totalDownloaded, totalUploaded, peakDownloadSpeed, peakUploadSpeed, deviceCount]);

  return { usage, loading };
}
