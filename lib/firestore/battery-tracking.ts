'use client';

import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { BatterySession, BatteryStats, BatteryDailyUsage } from '../types';

const SESSIONS_COLLECTION = 'battery_sessions';
const STATS_COLLECTION = 'battery_stats';

/**
 * Save a battery session
 */
export async function saveBatterySession(session: BatterySession): Promise<void> {
  try {
    const sessionRef = doc(collection(db, SESSIONS_COLLECTION));
    await setDoc(sessionRef, {
      ...session,
      sessionStart: Timestamp.fromMillis(session.sessionStart),
      sessionEnd: Timestamp.fromMillis(session.sessionEnd),
      createdAt: serverTimestamp(),
    });
    console.log('[Firestore] Battery session saved');
  } catch (error) {
    console.error('[Firestore] Error saving battery session:', error);
    throw error;
  }
}

/**
 * Get battery stats
 */
export async function getBatteryStats(): Promise<BatteryStats | null> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, 'current');
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const data = statsSnap.data();
      return {
        currentLevel: data.currentLevel || 0,
        isCharging: data.isCharging || false,
        currentSessionDuration: data.currentSessionDuration || 0,
        sessionStartTime: data.sessionStartTime?.toMillis() || undefined,
        todayDuration: data.todayDuration || 0,
        weeklyDuration: data.weeklyDuration || 0,
        monthlyDuration: data.monthlyDuration || 0,
        averageDailyDuration: data.averageDailyDuration || 0,
      };
    }

    return null;
  } catch (error) {
    console.error('[Firestore] Error getting battery stats:', error);
    throw error;
  }
}

/**
 * Update battery stats
 */
export async function updateBatteryStats(stats: Partial<BatteryStats>): Promise<void> {
  try {
    const statsRef = doc(db, STATS_COLLECTION, 'current');
    const existingStats = await getBatteryStats();

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    let todayDuration = stats.todayDuration || 0;
    let weeklyDuration = stats.weeklyDuration || 0;
    let monthlyDuration = stats.monthlyDuration || 0;

    if (existingStats) {
      const lastUpdate = existingStats.sessionStartTime 
        ? new Date(existingStats.sessionStartTime).toISOString().split('T')[0]
        : today;

      // If same day, add to existing
      if (lastUpdate === today) {
        todayDuration += existingStats.todayDuration || 0;
      }

      // Always add to weekly and monthly
      weeklyDuration += existingStats.weeklyDuration || 0;
      monthlyDuration += existingStats.monthlyDuration || 0;

      // Reset weekly if older than 7 days
      if (lastUpdate < weekStart) {
        weeklyDuration = stats.weeklyDuration || 0;
      }

      // Reset monthly if new month
      if (lastUpdate < monthStart) {
        monthlyDuration = stats.monthlyDuration || 0;
      }
    }

    await setDoc(statsRef, {
      currentLevel: stats.currentLevel ?? existingStats?.currentLevel ?? 0,
      isCharging: stats.isCharging ?? existingStats?.isCharging ?? false,
      currentSessionDuration: stats.currentSessionDuration ?? existingStats?.currentSessionDuration ?? 0,
      sessionStartTime: stats.sessionStartTime ? Timestamp.fromMillis(stats.sessionStartTime) : null,
      todayDuration,
      weeklyDuration,
      monthlyDuration,
      averageDailyDuration: weeklyDuration / 7,
      lastUpdate: today,
      updatedAt: serverTimestamp(),
    });

    console.log('[Firestore] Battery stats updated');
  } catch (error) {
    console.error('[Firestore] Error updating battery stats:', error);
    throw error;
  }
}

/**
 * Get battery daily usage for a date range
 */
export async function getBatteryDailyUsage(
  startDate: string,
  endDate: string
): Promise<BatteryDailyUsage[]> {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(
      sessionsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const sessionsByDate = new Map<string, BatterySession[]>();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const session: BatterySession = {
        sessionStart: data.sessionStart?.toMillis() || 0,
        sessionEnd: data.sessionEnd?.toMillis() || 0,
        duration: data.duration,
        startLevel: data.startLevel,
        endLevel: data.endLevel,
        isCharging: data.isCharging,
        date: data.date,
      };

      if (!sessionsByDate.has(session.date)) {
        sessionsByDate.set(session.date, []);
      }
      sessionsByDate.get(session.date)!.push(session);
    });

    const dailyUsage: BatteryDailyUsage[] = [];
    sessionsByDate.forEach((sessions, date) => {
      const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
      const avgLevel = sessions.reduce((sum, s) => sum + (s.startLevel + s.endLevel) / 2, 0) / sessions.length;

      dailyUsage.push({
        date,
        duration: totalDuration,
        sessions: sessions.length,
        averageLevel: Math.round(avgLevel),
      });
    });

    return dailyUsage.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('[Firestore] Error getting battery daily usage:', error);
    throw error;
  }
}

/**
 * Get weekly battery usage (Mon-Sun)
 */
export async function getWeeklyBatteryUsage(): Promise<BatteryDailyUsage[]> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate Monday of current week
  const monday = new Date(now);
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate Sunday of current week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  return getBatteryDailyUsage(startDate, endDate);
}

/**
 * Get yearly battery usage (current year)
 */
export async function getYearlyBatteryUsage(): Promise<BatteryDailyUsage[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; // Jan 1
  const endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]; // Dec 31

  return getBatteryDailyUsage(startDate, endDate);
}

/**
 * Get monthly battery usage (for backwards compatibility)
 */
export async function getMonthlyBatteryUsage(): Promise<BatteryDailyUsage[]> {
  return getYearlyBatteryUsage();
}
