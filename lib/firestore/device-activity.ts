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
import { DeviceActivity, DeviceActivitySummary } from '../types';

const ACTIVITIES_COLLECTION = 'device_activities';
const SUMMARIES_COLLECTION = 'device_activity_summaries';

/**
 * Save a device activity session
 */
export async function saveDeviceActivity(activity: DeviceActivity): Promise<void> {
  try {
    const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
    await setDoc(activityRef, {
      ...activity,
      sessionStart: Timestamp.fromMillis(activity.sessionStart),
      sessionEnd: Timestamp.fromMillis(activity.sessionEnd),
      createdAt: serverTimestamp(),
    });
    console.log('[Firestore] Device activity saved:', activity.mac);
  } catch (error) {
    console.error('[Firestore] Error saving device activity:', error);
    throw error;
  }
}

/**
 * Get device activity summary
 */
export async function getDeviceActivitySummary(mac: string): Promise<DeviceActivitySummary> {
  try {
    const summaryRef = doc(db, SUMMARIES_COLLECTION, mac);
    const summarySnap = await getDoc(summaryRef);

    if (summarySnap.exists()) {
      const data = summarySnap.data();
      return {
        lastActive: data.lastActive?.toMillis() || 0,
        todayDuration: data.todayDuration || 0,
        todayDataUsed: data.todayDataUsed || 0,
        weeklyDuration: data.weeklyDuration || 0,
        weeklyDataUsed: data.weeklyDataUsed || 0,
        monthlyDuration: data.monthlyDuration || 0,
        monthlyDataUsed: data.monthlyDataUsed || 0,
      };
    }

    // Return empty summary if not found
    return {
      lastActive: 0,
      todayDuration: 0,
      todayDataUsed: 0,
      weeklyDuration: 0,
      weeklyDataUsed: 0,
      monthlyDuration: 0,
      monthlyDataUsed: 0,
    };
  } catch (error) {
    console.error('[Firestore] Error getting device activity summary:', error);
    throw error;
  }
}

/**
 * Update device activity summary
 */
export async function updateDeviceActivitySummary(
  mac: string,
  duration: number,
  dataUsed: number
): Promise<void> {
  try {
    const summaryRef = doc(db, SUMMARIES_COLLECTION, mac);
    const summarySnap = await getDoc(summaryRef);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    let todayDuration = duration;
    let todayDataUsed = dataUsed;
    let weeklyDuration = duration;
    let weeklyDataUsed = dataUsed;
    let monthlyDuration = duration;
    let monthlyDataUsed = dataUsed;

    if (summarySnap.exists()) {
      const existing = summarySnap.data();
      const lastUpdate = existing.lastUpdate || today;

      // If same day, add to existing
      if (lastUpdate === today) {
        todayDuration += existing.todayDuration || 0;
        todayDataUsed += existing.todayDataUsed || 0;
      }

      // Always add to weekly and monthly (they span multiple days)
      weeklyDuration += existing.weeklyDuration || 0;
      weeklyDataUsed += existing.weeklyDataUsed || 0;
      monthlyDuration += existing.monthlyDuration || 0;
      monthlyDataUsed += existing.monthlyDataUsed || 0;

      // Reset weekly if older than 7 days
      if (lastUpdate < weekStart) {
        weeklyDuration = duration;
        weeklyDataUsed = dataUsed;
      }

      // Reset monthly if new month
      if (lastUpdate < monthStart) {
        monthlyDuration = duration;
        monthlyDataUsed = dataUsed;
      }
    }

    await setDoc(summaryRef, {
      mac,
      lastActive: Timestamp.now(),
      lastUpdate: today,
      todayDuration,
      todayDataUsed,
      weeklyDuration,
      weeklyDataUsed,
      monthlyDuration,
      monthlyDataUsed,
      updatedAt: serverTimestamp(),
    });

    console.log('[Firestore] Device activity summary updated:', mac);
  } catch (error) {
    console.error('[Firestore] Error updating device activity summary:', error);
    throw error;
  }
}

/**
 * Get device activities for a date range
 */
export async function getDeviceActivities(
  mac: string,
  startDate: string,
  endDate: string
): Promise<DeviceActivity[]> {
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const q = query(
      activitiesRef,
      where('mac', '==', mac),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc'),
      orderBy('sessionStart', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const activities: DeviceActivity[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        mac: data.mac,
        sessionStart: data.sessionStart?.toMillis() || 0,
        sessionEnd: data.sessionEnd?.toMillis() || 0,
        duration: data.duration,
        dataUsed: data.dataUsed,
        date: data.date,
      });
    });

    return activities;
  } catch (error) {
    console.error('[Firestore] Error getting device activities:', error);
    throw error;
  }
}
