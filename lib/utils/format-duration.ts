/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @param short - Use short format (1h 30m) instead of long (1 hour 30 minutes)
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, short: boolean = false): string {
  if (seconds === 0) return short ? '0s' : '0 seconds';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(short ? `${hours}h` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }
  
  if (minutes > 0) {
    parts.push(short ? `${minutes}m` : `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }
  
  if (secs > 0 || parts.length === 0) {
    parts.push(short ? `${secs}s` : `${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }
  
  return parts.join(' ');
}

/**
 * Format duration to compact format (HH:MM:SS)
 */
export function formatDurationCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
