'use client';

import { useState, useEffect } from 'react';
import { SystemStatus } from '../types';

export function useSystemStatus(refreshInterval: number = 5000) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/router', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch system status');
        }

        const data = await response.json();
        
        if (mounted && data.system_status) {
          setStatus(data.system_status);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useSystemStatus] Error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll at interval
    const intervalId = setInterval(fetchStatus, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  return { status, loading };
}
