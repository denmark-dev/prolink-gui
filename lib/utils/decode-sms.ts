/**
 * Decode Unicode hex encoded SMS content
 * Format: "00480069" -> "Hi"
 */
export function decodeSMSContent(hexContent: string): string {
  if (!hexContent) return '';
  
  try {
    // Remove any spaces and ensure even length
    const cleanHex = hexContent.replace(/\s/g, '');
    
    // Convert hex pairs to characters
    let decoded = '';
    for (let i = 0; i < cleanHex.length; i += 4) {
      const hexPair = cleanHex.substr(i, 4);
      const charCode = parseInt(hexPair, 16);
      if (!isNaN(charCode)) {
        decoded += String.fromCharCode(charCode);
      }
    }
    
    return decoded;
  } catch (error) {
    console.error('[decodeSMS] Error decoding SMS content:', error);
    return hexContent; // Return original if decode fails
  }
}

/**
 * Parse SMS date string to JavaScript Date
 * Format: "25,11,24,13,44,45,+32" (day,month,year,hour,min,sec,timezone)
 */
export function parseSMSDate(dateStr: string): Date {
  try {
    const parts = dateStr.split(',');
    if (parts.length < 6) return new Date();
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
    const year = 2000 + parseInt(parts[2]); // Assuming 20xx
    const hour = parseInt(parts[3]);
    const minute = parseInt(parts[4]);
    const second = parseInt(parts[5]);
    
    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.error('[parseSMSDate] Error parsing SMS date:', error);
    return new Date();
  }
}

/**
 * Format SMS date for display
 */
export function formatSMSDate(dateStr: string): string {
  const date = parseSMSDate(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
