'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRouterDevices, calculateSpeed, measurePing } from '../router/api';
import { DeviceStats } from '../types';
import {
  saveDeviceStats,
  saveUsageSnapshot,
  saveDeviceInfo,
  getDeviceInfo,
} from '../firestore/device-stats';

interface UseRouterDataOptions {
  refreshInterval?: number; // milliseconds
  enableFirestore?: boolean;
}

export function useRouterData(options: UseRouterDataOptions = {}) {
  const { refreshInterval = 2000, enableFirestore = true } = options;

  const [devices, setDevices] = useState<DeviceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const previousDataRef = useRef<Map<string, { rx: number; tx: number; timestamp: number }>>(
    new Map()
  );
  const previousDevicesRef = useRef<Map<string, DeviceStats>>(new Map());
  const speedHistoryRef = useRef<Map<string, { downloadSpeed: number; uploadSpeed: number }[]>>(
    new Map()
  );

  const fetchAndUpdateDevices = useCallback(async () => {
    try {
      console.log('[Hook] Fetching router devices...');
      const routerDevices = await fetchRouterDevices();
      console.log('[Hook] Received devices:', routerDevices);
      const currentTime = Date.now();
      const updatedDevices: DeviceStats[] = [];
      const currentMacs = new Set(routerDevices.map(d => d.mac));

      for (const device of routerDevices) {
        const previousData = previousDataRef.current.get(device.mac);
        const previousDevice = previousDevicesRef.current.get(device.mac);

        let downloadSpeed = 0;
        let uploadSpeed = 0;

        if (previousData) {
          const timeDelta = (currentTime - previousData.timestamp) / 1000;
          
          // Only calculate if time delta is reasonable (between 0.5 and 10 seconds)
          if (timeDelta >= 0.5 && timeDelta <= 10) {
            const speeds = calculateSpeed(
              device.rx,
              device.tx,
              previousData.rx,
              previousData.tx,
              timeDelta
            );
            
            // Get speed history for this device
            const history = speedHistoryRef.current.get(device.mac) || [];
            
            // Add new speeds to history
            history.push({
              downloadSpeed: speeds.downloadSpeed,
              uploadSpeed: speeds.uploadSpeed,
            });
            
            // Keep only last 3 measurements for smoothing
            if (history.length > 3) {
              history.shift();
            }
            
            speedHistoryRef.current.set(device.mac, history);
            
            // Calculate exponential moving average (EMA) for smoother transitions
            // Weight: 0.4 for current, 0.6 for previous (smoother decay)
            const alpha = 0.4;
            
            if (previousDevice) {
              downloadSpeed = alpha * speeds.downloadSpeed + (1 - alpha) * previousDevice.downloadSpeed;
              uploadSpeed = alpha * speeds.uploadSpeed + (1 - alpha) * previousDevice.uploadSpeed;
              
              console.log(`[Speed Smoothing] ${device.mac}:`, {
                raw: { down: speeds.downloadSpeed, up: speeds.uploadSpeed },
                previous: { down: previousDevice.downloadSpeed, up: previousDevice.uploadSpeed },
                smoothed: { down: downloadSpeed, up: uploadSpeed },
                timeDelta,
              });
            } else {
              downloadSpeed = speeds.downloadSpeed;
              uploadSpeed = speeds.uploadSpeed;
            }
            
            // Apply minimum threshold to avoid showing very small fluctuations
            if (downloadSpeed < 100) downloadSpeed = 0;
            if (uploadSpeed < 100) uploadSpeed = 0;
          } else if (previousDevice) {
            // If time delta is invalid, decay previous speeds
            downloadSpeed = previousDevice.downloadSpeed * 0.7;
            uploadSpeed = previousDevice.uploadSpeed * 0.7;
            
            if (downloadSpeed < 100) downloadSpeed = 0;
            if (uploadSpeed < 100) uploadSpeed = 0;
          }
        }

        // Measure ping
        const ping = await measurePing();

        const deviceStats: DeviceStats = {
          mac: device.mac,
          hostname: device.hostname,
          rx: device.rx,
          tx: device.tx,
          rssi: device.rssi,
          downloadSpeed,
          uploadSpeed,
          ping,
          lastUpdate: currentTime,
          ip: device.ip,
          isConnected: true, // Device is currently connected
          connectionTime: device.connectionTime,
          activeDuration: device.connectionTime,
        };

        updatedDevices.push(deviceStats);
        previousDevicesRef.current.set(device.mac, deviceStats);

        // Update previous data
        previousDataRef.current.set(device.mac, {
          rx: device.rx,
          tx: device.tx,
          timestamp: currentTime,
        });

        // Save to Firestore
        if (enableFirestore) {
          try {
            await saveDeviceStats(deviceStats);

            // Save usage snapshot
            await saveUsageSnapshot(device.mac, {
              timestamp: currentTime,
              rx: device.rx,
              tx: device.tx,
              downloadSpeed,
              uploadSpeed,
              ping,
              rssi: device.rssi,
            });

            // Update device info
            const existingInfo = await getDeviceInfo(device.mac);
            await saveDeviceInfo({
              mac: device.mac,
              hostname: device.hostname,
              deviceType: 'Device',
              deviceImage: '',
              firstSeen: existingInfo?.firstSeen || currentTime,
              lastSeen: currentTime,
            });
          } catch (firestoreError) {
            console.error('Firestore save error:', firestoreError);
          }
        }
      }

      // Add disconnected devices (devices that were previously connected but not in current list)
      for (const [mac, prevDevice] of previousDevicesRef.current.entries()) {
        if (!currentMacs.has(mac)) {
          // Device disconnected - add it with zero speeds and isConnected = false
          updatedDevices.push({
            ...prevDevice,
            downloadSpeed: 0,
            uploadSpeed: 0,
            ping: 0,
            lastUpdate: currentTime,
            isConnected: false,
          });
        }
      }

      console.log('[Hook] Setting devices state:', updatedDevices.length, 'devices');
      setDevices(updatedDevices);
      setLastUpdate(currentTime);
      setError(null);
      setLoading(false);
      console.log('[Hook] State updated, loading set to false');
    } catch (err) {
      console.error('[Hook] Failed to fetch router data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [enableFirestore]);

  useEffect(() => {
    // Initial fetch
    fetchAndUpdateDevices();

    // Set up interval
    const intervalId = setInterval(fetchAndUpdateDevices, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAndUpdateDevices, refreshInterval]);

  return {
    devices,
    loading,
    error,
    lastUpdate,
    refresh: fetchAndUpdateDevices,
  };
}
