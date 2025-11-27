'use client';

import { useState, useEffect } from 'react';
import { SystemStatus } from '../types';
import { fetchFromRouter } from '../utils/router-fetch';

export function useSystemStatus(refreshInterval: number = 5000) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await fetchFromRouter('/reqproc/proc_get', {
          isTest: 'false',
          cmd: 'wa_inner_version,cr_version,RealTime_time,battery_charging,battery_vol_percent,battery_pers,spn_name_data,network_provider,signalbar,network_type,rssi,rscp,lte_rsrp,Z5g_snr,Z5g_rsrp,wan_ipaddr,ipv6_wan_ipaddr,ipv6_pdp_type,ppp_status,EX_SSID1,sta_ip_status,EX_wifi_profile,m_netselect_contents,loginfo,new_version_state,current_upgrade_state,is_mandatory',
          multi_data: '1',
        });

        if (data) {
          setStatus(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useSystemStatus] Error:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll at interval
    const intervalId = setInterval(fetchStatus, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  return { status, loading };
}
