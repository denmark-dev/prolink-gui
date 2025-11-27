import { RouterDevice } from '../types';
import { fetchFromRouter } from '../utils/router-fetch';

export interface StationInfo {
  connect_time: number;
  ssid_index: string;
  dev_type: string;
  mac_addr: string;
  hostname: string;
  ip_addr: string;
  ip_type: string;
}

export interface RouterResponse {
  sta_info1?: string;
  sta_info2?: string;
  sta_info3?: string;
  sta_info4?: string;
  sta_info5?: string;
  sta_info6?: string;
  station_list?: StationInfo[];
  error?: string;
  details?: string;
  hint?: string;
}

/**
 * Fetch connected devices from the Prolink router
 */
export async function fetchRouterDevices(): Promise<RouterDevice[]> {
  try {
    const data: RouterResponse = await fetchFromRouter('/reqproc/proc_get', {
      isTest: 'false',
      cmd: 'sta_info1,sta_info2,sta_info3,sta_info4,sta_info5,sta_info6,station_list',
      multi_data: '1',
    });
    
    // Check for error in response
    if (data.error) {
      throw new Error(data.error);
    }
    
    return parseRouterResponse(data);
  } catch (error) {
    console.error('Failed to fetch router devices:', error);
    throw error;
  }
}

/**
 * Parse the router API response into device objects
 */
function parseRouterResponse(data: RouterResponse): RouterDevice[] {
  const devices: RouterDevice[] = [];

  console.log('[Parser] Starting to parse router response:', data);

  // Process each sta_info slot (up to 6 devices)
  for (let i = 1; i <= 6; i++) {
    const key = `sta_info${i}` as keyof RouterResponse;
    const deviceData = data[key];

    // Skip station_list
    if (key === 'station_list' || typeof deviceData !== 'string') {
      continue;
    }

    console.log(`[Parser] Processing ${key}:`, deviceData);

    if (deviceData && deviceData !== 'none' && deviceData !== '') {
      const device = parseDeviceString(deviceData, i);
      console.log(`[Parser] Parsed device from ${key}:`, device);
      
      if (device && device.mac !== 'Unknown' && device.mac !== '') {
        devices.push(device);
        console.log(`[Parser] Device ${device.mac} added as Device ${i}`);
      } else if (device) {
        console.log(`[Parser] Skipping invalid device with MAC: ${device.mac}`);
      }
    }
  }

  console.log('[Parser] Total devices parsed:', devices.length, devices);
  
  // Deduplicate by MAC address (keep the one with higher rx+tx = most recent)
  const deviceMap = new Map<string, RouterDevice>();
  for (const device of devices) {
    const existing = deviceMap.get(device.mac);
    const currentTotal = device.rx + device.tx;
    const existingTotal = existing ? existing.rx + existing.tx : 0;
    
    console.log(`[Parser] Checking device ${device.mac}: current=${currentTotal}, existing=${existingTotal}`);
    
    if (!existing || currentTotal > existingTotal) {
      console.log(`[Parser] Keeping device ${device.mac} with total ${currentTotal}`);
      deviceMap.set(device.mac, device);
    } else {
      console.log(`[Parser] Skipping device ${device.mac}, existing has more data`);
    }
  }
  
  const uniqueDevices = Array.from(deviceMap.values());
  console.log('[Parser] Unique devices after deduplication:', uniqueDevices.length, uniqueDevices);
  
  return uniqueDevices;
}

/**
 * Parse individual device string from router
 * Expected format: "tm:2025-11-27 18:42:09,mac:86:52:47:47:4e:0a,ipaddr:192.168.1.101,link_time:2hr46min4sec,rx_bytes:72986240,tx_bytes:667381878"
 */
function parseDeviceString(deviceStr: string, deviceNumber: number): RouterDevice | null {
  try {
    // Parse key:value pairs
    const pairs = deviceStr.split(',');
    const data: Record<string, string> = {};
    
    for (const pair of pairs) {
      const [key, value] = pair.split(':');
      if (key && value) {
        data[key.trim()] = value.trim();
      }
    }

    // Extract MAC address (format might have colons after 'mac')
    const macMatch = deviceStr.match(/mac:([0-9a-fA-F:]+)/);
    const mac = macMatch ? macMatch[1] : data.mac || 'Unknown';

    // Extract IP address
    const ipMatch = deviceStr.match(/ipaddr:([0-9.]+)/);
    const ip = ipMatch ? ipMatch[1] : data.ipaddr || '';

    // Extract rx_bytes and tx_bytes
    // From router's perspective: RX = router receives (device upload), TX = router transmits (device download)
    const rxMatch = deviceStr.match(/rx_bytes:(\d+)/);
    const txMatch = deviceStr.match(/tx_bytes:(\d+)/);
    
    // Swap them: rx (router receives) = upload, tx (router transmits) = download
    const rx = txMatch ? parseInt(txMatch[1]) : 0; // Download (router TX)
    const tx = rxMatch ? parseInt(rxMatch[1]) : 0; // Upload (router RX)

    // Parse link_time (format: "2hr46min4sec" or "46min4sec" or "4sec")
    const linkTimeMatch = deviceStr.match(/link_time:([^,]+)/);
    let connectionTime = 0;
    if (linkTimeMatch) {
      const timeStr = linkTimeMatch[1];
      const hours = timeStr.match(/(\d+)h/);
      const minutes = timeStr.match(/(\d+)m/);
      const seconds = timeStr.match(/(\d+)s/);
      
      connectionTime = 
        (hours ? parseInt(hours[1]) * 3600 : 0) +
        (minutes ? parseInt(minutes[1]) * 60 : 0) +
        (seconds ? parseInt(seconds[1]) : 0);
    }

    // Simple sequential device naming: Device 1, Device 2, Device 3, etc.
    const hostname = `Device ${deviceNumber}`;

    return {
      mac,
      hostname,
      rx,
      tx,
      rssi: -50, // Default RSSI since router doesn't provide it
      ip,
      connectionTime,
    };
  } catch (error) {
    console.error('Failed to parse device string:', deviceStr, error);
    return null;
  }
}

/**
 * Calculate instant speed from two measurements
 */
export function calculateSpeed(
  currentRx: number,
  currentTx: number,
  previousRx: number,
  previousTx: number,
  timeDeltaSeconds: number
): { downloadSpeed: number; uploadSpeed: number } {
  if (timeDeltaSeconds <= 0) {
    return { downloadSpeed: 0, uploadSpeed: 0 };
  }

  const downloadSpeed = Math.max(0, (currentRx - previousRx) / timeDeltaSeconds);
  const uploadSpeed = Math.max(0, (currentTx - previousTx) / timeDeltaSeconds);

  return { downloadSpeed, uploadSpeed };
}

/**
 * Measure ping using fetch timing to the router
 */
export async function measurePing(): Promise<number> {
  try {
    const startTime = performance.now();
    
    await fetchFromRouter('/reqproc/proc_get', {
      isTest: 'false',
      cmd: 'wa_inner_version',
      multi_data: '1',
    });
    
    const endTime = performance.now();
    return Math.round(endTime - startTime);
  } catch (error) {
    console.error('Ping measurement failed:', error);
    return -1;
  }
}

/**
 * Test data for development
 */
export function getTestDevices(): RouterDevice[] {
  return [
    {
      mac: '00:1A:2B:3C:4D:5E',
      hostname: 'iPhone-14-Pro',
      rx: 1024000000,
      tx: 512000000,
      rssi: -45,
      ip: '192.168.1.100',
    },
    {
      mac: '00:1A:2B:3C:4D:5F',
      hostname: 'MacBook-Pro',
      rx: 2048000000,
      tx: 1024000000,
      rssi: -38,
      ip: '192.168.1.101',
    },
    {
      mac: '00:1A:2B:3C:4D:60',
      hostname: 'iPad-Air',
      rx: 512000000,
      tx: 256000000,
      rssi: -52,
      ip: '192.168.1.102',
    },
  ];
}
