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
