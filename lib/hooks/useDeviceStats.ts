'use client';

import { useState, useEffect } from 'react';
import { DeviceStats } from '../types';
import { fetchRouterDevices, measurePing, calculateSpeed } from '../router/api';
import { classifyDevice } from '../router/device-classifier';

export function useDeviceStats(mac: string) {
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        const devices = await fetchRouterDevices();
        const device = devices.find(d => d.mac.toUpperCase() === mac.toUpperCase());

        if (device && mounted) {
          const classification = classifyDevice(device.hostname, device.mac);
          const ping = await measurePing();

          const deviceStats: DeviceStats = {
            mac: device.mac,
            hostname: device.hostname,
            rx: device.rx,
            tx: device.tx,
            rssi: device.rssi,
            downloadSpeed: 0, // Will be calculated on next update
            uploadSpeed: 0,
            ping,
            lastUpdate: Date.now(),
            ip: device.ip,
            isConnected: true,
          };

          setStats(deviceStats);
          setLoading(false);
        } else if (mounted) {
          setStats(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useDeviceStats] Error fetching device:', error);
        if (mounted) {
          setStats(null);
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchStats();

    // Poll every 2 seconds
    intervalId = setInterval(fetchStats, 2000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [mac]);

  return { stats, loading };
}
