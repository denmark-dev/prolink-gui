import { db } from './config';
import { doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface HotspotUsage {
  date: string; // YYYY-MM-DD
  totalDownloaded: number; // bytes
  totalUploaded: number; // bytes
  totalUsage: number; // bytes
  peakDownloadSpeed: number; // bytes/s
  peakUploadSpeed: number; // bytes/s
  deviceCount: number;
  lastUpdated: number; // timestamp
}

export interface UsagePeriod {
  daily: HotspotUsage | null;
  weekly: number; // total bytes for past 7 days
  monthly: number; // total bytes for current month
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get the start of the current week (Sunday)
 */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

/**
 * Get the start of the current month
 */
function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Save or update today's hotspot usage
 */
export async function saveHotspotUsage(
  totalDownloaded: number,
  totalUploaded: number,
  peakDownloadSpeed: number,
  peakUploadSpeed: number,
  deviceCount: number
): Promise<void> {
  try {
    const today = getTodayDate();
    const usageRef = doc(db, 'hotspot_usage', today);
    
    // Get existing data to preserve peak values
    const existing = await getDoc(usageRef);
    const existingData = existing.exists() ? existing.data() as HotspotUsage : null;

    const usage: HotspotUsage = {
      date: today,
      totalDownloaded,
      totalUploaded,
      totalUsage: totalDownloaded + totalUploaded,
      peakDownloadSpeed: Math.max(peakDownloadSpeed, existingData?.peakDownloadSpeed || 0),
      peakUploadSpeed: Math.max(peakUploadSpeed, existingData?.peakUploadSpeed || 0),
      deviceCount: Math.max(deviceCount, existingData?.deviceCount || 0),
      lastUpdated: Date.now(),
    };

    await setDoc(usageRef, usage);
  } catch (error) {
    console.error('Error saving hotspot usage:', error);
    throw error;
  }
}

/**
 * Get today's usage
 */
export async function getTodayUsage(): Promise<HotspotUsage | null> {
  try {
    const today = getTodayDate();
    const usageRef = doc(db, 'hotspot_usage', today);
    const snapshot = await getDoc(usageRef);

    if (snapshot.exists()) {
      return snapshot.data() as HotspotUsage;
    }
    return null;
  } catch (error) {
    console.error('Error getting today usage:', error);
    return null;
  }
}

/**
 * Get weekly usage (past 7 days)
 */
export async function getWeeklyUsage(): Promise<number> {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const usageQuery = query(
      collection(db, 'hotspot_usage'),
      where('date', '>=', startDate),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(usageQuery);
    let total = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() as HotspotUsage;
      total += data.totalUsage;
    });

    return total;
  } catch (error) {
    console.error('Error getting weekly usage:', error);
    return 0;
  }
}

/**
 * Get monthly usage (current month)
 */
export async function getMonthlyUsage(): Promise<number> {
  try {
    const monthStart = getMonthStart();

    const usageQuery = query(
      collection(db, 'hotspot_usage'),
      where('date', '>=', monthStart),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(usageQuery);
    let total = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() as HotspotUsage;
      total += data.totalUsage;
    });

    return total;
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return 0;
  }
}

/**
 * Get all usage periods (daily, weekly, monthly)
 */
export async function getAllUsagePeriods(): Promise<UsagePeriod> {
  try {
    const [daily, weekly, monthly] = await Promise.all([
      getTodayUsage(),
      getWeeklyUsage(),
      getMonthlyUsage(),
    ]);

    return {
      daily,
      weekly,
      monthly,
    };
  } catch (error) {
    console.error('Error getting all usage periods:', error);
    return {
      daily: null,
      weekly: 0,
      monthly: 0,
    };
  }
}

/**
 * Get usage history for a date range
 */
export async function getUsageHistory(startDate: string, endDate: string): Promise<HotspotUsage[]> {
  try {
    const usageQuery = query(
      collection(db, 'hotspot_usage'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(usageQuery);
    const history: HotspotUsage[] = [];

    snapshot.forEach((doc) => {
      history.push(doc.data() as HotspotUsage);
    });

    return history;
  } catch (error) {
    console.error('Error getting usage history:', error);
    return [];
  }
}
