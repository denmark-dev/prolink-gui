/**
 * Parse uptime string from router to seconds
 * Format: "10:50:51" (hours:minutes:seconds)
 * @param uptime - Uptime string from router
 * @returns Duration in seconds
 */
export function parseUptime(uptime: string | undefined): number {
  if (!uptime) return 0;

  try {
    const parts = uptime.split(':');
    
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
  } catch (error) {
    console.error('[parseUptime] Error parsing uptime:', uptime, error);
    return 0;
  }
}
