export interface RouterDevice {
  mac: string;
  hostname: string;
  rx: number; // bytes received
  tx: number; // bytes transmitted
  rssi: number; // signal strength
  ip?: string;
  connectionTime?: number;
}

export interface DeviceStats {
  mac: string;
  hostname: string;
  rx: number;
  tx: number;
  rssi: number;
  downloadSpeed: number; // bytes per second
  uploadSpeed: number; // bytes per second
  ping: number; // milliseconds
  lastUpdate: number; // timestamp
  ip?: string;
  isConnected: boolean; // whether device is currently connected
  activeDuration?: number; // seconds - current session duration
  connectionTime?: number; // timestamp when device connected
  lastActiveTime?: number; // timestamp of last activity
}

export interface UsageSnapshot {
  timestamp: number;
  rx: number;
  tx: number;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  rssi: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalRx: number;
  totalTx: number;
  avgDownloadSpeed: number;
  avgUploadSpeed: number;
  avgPing: number;
  peakDownloadSpeed: number;
  peakUploadSpeed: number;
}

export interface DeviceInfo {
  mac: string;
  hostname: string;
  deviceType: string;
  deviceImage: string;
  firstSeen: number;
  lastSeen: number;
}

export interface DeviceActivity {
  mac: string;
  sessionStart: number; // timestamp
  sessionEnd: number; // timestamp
  duration: number; // seconds
  dataUsed: number; // bytes (rx + tx)
  date: string; // YYYY-MM-DD
}

export interface DeviceActivitySummary {
  lastActive: number; // timestamp of last session
  todayDuration: number; // seconds
  todayDataUsed: number; // bytes
  weeklyDuration: number; // seconds
  weeklyDataUsed: number; // bytes
  monthlyDuration: number; // seconds
  monthlyDataUsed: number; // bytes
}

export interface HotspotStats {
  totalDevices: number;
  totalRxToday: number;
  totalTxToday: number;
  currentDownloadSpeed: number;
  currentUploadSpeed: number;
  signalStrength: number;
  batteryLevel?: number;
}

export interface SystemStatus {
  network_provider?: string;
  spn_name_data?: string;
  battery_charging?: string;
  battery_vol_percent?: string;
  battery_pers?: string;
  signalbar?: string;
  network_type?: string;
  sub_network_type?: string;
  realtime_time?: string; // Router uptime in seconds (e.g., "39511")
}

export interface BatterySession {
  sessionStart: number; // timestamp
  sessionEnd: number; // timestamp
  duration: number; // seconds
  startLevel: number; // percentage
  endLevel: number; // percentage
  isCharging: boolean;
  date: string; // YYYY-MM-DD
}

export interface BatteryStats {
  currentLevel: number; // percentage
  isCharging: boolean;
  currentSessionDuration: number; // seconds - how long has hotspot been on
  sessionStartTime?: number; // timestamp when hotspot was turned on
  todayDuration: number; // total seconds hotspot was on today
  weeklyDuration: number; // total seconds this week
  monthlyDuration: number; // total seconds this month
  averageDailyDuration: number; // average seconds per day
}

export interface BatteryDailyUsage {
  date: string; // YYYY-MM-DD
  duration: number; // seconds
  sessions: number; // number of sessions
  averageLevel: number; // average battery level
}

export type TimeRange = 'today' | '7days' | '30days';

export interface SMSMessage {
  id: string;
  number: string;
  content: string; // Unicode hex encoded
  tag: string; // "1" = inbox, "2" = sent, etc.
  date: string; // Format: "25,11,24,13,44,45,+32" (day,month,year,hour,min,sec,timezone)
  draft_group_id: string;
}

export interface SMSResponse {
  messages: SMSMessage[];
}
