export interface DeviceClassification {
  type: string;
  brand: string;
  model?: string;
  imageUrl: string;
}

/**
 * Classify device type and get appropriate image
 * Simplified to 3 categories: iPhone, Android, Laptop/Desktop
 */
export function classifyDevice(hostname: string, mac: string): DeviceClassification {
  const lowerHostname = hostname.toLowerCase();

  // Apple iPhone/iPad (treat as iPhone category)
  if (lowerHostname.includes('iphone') || lowerHostname.includes('ipad')) {
    return {
      type: 'iPhone',
      brand: 'Apple',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/0/747.png', // Apple logo
    };
  }

  // Apple Mac/MacBook (treat as Laptop category)
  if (lowerHostname.includes('macbook') || lowerHostname.includes('mac') || 
      lowerHostname.includes('imac')) {
    return {
      type: 'Laptop',
      brand: 'Apple',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/0/747.png', // Apple logo
    };
  }

  // Android/Samsung devices
  if (lowerHostname.includes('android') || lowerHostname.includes('samsung') || 
      lowerHostname.includes('galaxy') || lowerHostname.includes('pixel') ||
      lowerHostname.includes('xiaomi') || lowerHostname.includes('huawei') ||
      lowerHostname.includes('oppo') || lowerHostname.includes('vivo') ||
      lowerHostname.includes('oneplus') || lowerHostname.includes('realme')) {
    return {
      type: 'Android',
      brand: 'Android',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/888/888839.png', // Android logo
    };
  }

  // Laptop/Desktop devices (Windows, Linux, etc.)
  if (lowerHostname.includes('windows') || lowerHostname.includes('desktop') || 
      lowerHostname.includes('laptop') || lowerHostname.includes('pc') ||
      lowerHostname.includes('nitro') || lowerHostname.includes('asus') ||
      lowerHostname.includes('dell') || lowerHostname.includes('hp') ||
      lowerHostname.includes('lenovo') || lowerHostname.includes('acer')) {
    return {
      type: 'Laptop',
      brand: 'Computer',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png', // Laptop logo
    };
  }

  // Check MAC address for vendor to determine device type
  const vendor = getMacVendor(mac);
  if (vendor === 'Apple') {
    return {
      type: 'iPhone',
      brand: 'Apple',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/0/747.png',
    };
  } else if (vendor === 'Samsung') {
    return {
      type: 'Android',
      brand: 'Android',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/888/888839.png',
    };
  }

  // Default to Laptop for unknown devices
  return {
    type: 'Laptop',
    brand: 'Unknown',
    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3474/3474360.png',
  };
}

/**
 * Extract Apple device model from hostname
 */
function extractAppleModel(hostname: string, deviceType: string): string {
  const patterns = {
    iphone: /iphone[- ]?(\d+)([- ]?pro)?([- ]?max)?/i,
    ipad: /ipad[- ]?(pro|air|mini)?[- ]?(\d+)?/i,
    mac: /macbook[- ]?(pro|air)?[- ]?(\d+)?/i,
  };

  const pattern = patterns[deviceType as keyof typeof patterns];
  if (!pattern) return deviceType;

  const match = hostname.match(pattern);
  if (match) {
    return match[0];
  }

  return deviceType;
}

/**
 * Get Apple device image URL
 * Using placeholder approach - in production, integrate with Apple's product API
 */
function getAppleDeviceImage(deviceType: string, hostname: string): string {
  const lowerHostname = hostname.toLowerCase();

  // iPhone models
  if (deviceType === 'iphone') {
    if (lowerHostname.includes('15')) return '/images/devices/iphone-15.png';
    if (lowerHostname.includes('14')) return '/images/devices/iphone-14.png';
    if (lowerHostname.includes('13')) return '/images/devices/iphone-13.png';
    return '/images/devices/iphone-generic.png';
  }

  // iPad models
  if (deviceType === 'ipad') {
    if (lowerHostname.includes('pro')) return '/images/devices/ipad-pro.png';
    if (lowerHostname.includes('air')) return '/images/devices/ipad-air.png';
    if (lowerHostname.includes('mini')) return '/images/devices/ipad-mini.png';
    return '/images/devices/ipad-generic.png';
  }

  // Mac models
  if (deviceType === 'mac') {
    if (lowerHostname.includes('pro')) return '/images/devices/macbook-pro.png';
    if (lowerHostname.includes('air')) return '/images/devices/macbook-air.png';
    return '/images/devices/mac-generic.png';
  }

  return '/images/devices/apple-generic.png';
}

/**
 * Get vendor from MAC address (first 3 octets)
 */
function getMacVendor(mac: string): string | null {
  const macPrefix = mac.substring(0, 8).toUpperCase();

  const vendors: Record<string, string> = {
    '00:1A:2B': 'Apple',
    '00:50:56': 'VMware',
    '00:0C:29': 'VMware',
    '08:00:27': 'VirtualBox',
    'DC:A6:32': 'Raspberry Pi',
    'B8:27:EB': 'Raspberry Pi',
    '00:1B:44': 'Samsung',
    'AC:DE:48': 'Samsung',
  };

  return vendors[macPrefix] || null;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format speed to human readable format
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];

  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));

  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get signal strength label
 */
export function getSignalStrength(rssi: number): { label: string; color: string } {
  if (rssi >= -50) {
    return { label: 'Excellent', color: 'text-green-500' };
  } else if (rssi >= -60) {
    return { label: 'Good', color: 'text-blue-500' };
  } else if (rssi >= -70) {
    return { label: 'Fair', color: 'text-yellow-500' };
  } else {
    return { label: 'Poor', color: 'text-red-500' };
  }
}
