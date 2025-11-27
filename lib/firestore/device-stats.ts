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
  onSnapshot,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DeviceStats, UsageSnapshot, DailyUsage, DeviceInfo } from '../types';

/**
 * Save current device stats to Firestore
 */
export async function saveDeviceStats(stats: DeviceStats): Promise<void> {
  try {
    const deviceRef = doc(db, 'devices', stats.mac, 'current', 'latest');
    await setDoc(deviceRef, {
      ...stats,
      lastUpdate: Timestamp.fromMillis(stats.lastUpdate),
    });
  } catch (error) {
    console.error('Failed to save device stats:', error);
    throw error;
  }
}

/**
 * Get current device stats from Firestore
 */
export async function getDeviceStats(mac: string): Promise<DeviceStats | null> {
  try {
    const deviceRef = doc(db, 'devices', mac, 'current', 'latest');
    const docSnap = await getDoc(deviceRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastUpdate: data.lastUpdate.toMillis(),
      } as DeviceStats;
    }

    return null;
  } catch (error) {
    console.error('Failed to get device stats:', error);
    return null;
  }
}

/**
 * Save usage snapshot to history
 */
export async function saveUsageSnapshot(
  mac: string,
  snapshot: UsageSnapshot
): Promise<void> {
  try {
    const usageRef = collection(db, 'devices', mac, 'usage');
    await addDoc(usageRef, {
      ...snapshot,
      timestamp: Timestamp.fromMillis(snapshot.timestamp),
    });
  } catch (error) {
    console.error('Failed to save usage snapshot:', error);
    throw error;
  }
}

/**
 * Get usage history for a device
 */
export async function getUsageHistory(
  mac: string,
  startTime: number,
  endTime: number,
  maxResults: number = 1000
): Promise<UsageSnapshot[]> {
  try {
    const usageRef = collection(db, 'devices', mac, 'usage');
    const q = query(
      usageRef,
      where('timestamp', '>=', Timestamp.fromMillis(startTime)),
      where('timestamp', '<=', Timestamp.fromMillis(endTime)),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const snapshots: UsageSnapshot[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      snapshots.push({
        ...data,
        timestamp: data.timestamp.toMillis(),
      } as UsageSnapshot);
    });

    return snapshots.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Failed to get usage history:', error);
    return [];
  }
}

/**
 * Save device info
 */
export async function saveDeviceInfo(info: DeviceInfo): Promise<void> {
  try {
    const deviceRef = doc(db, 'devices', info.mac);
    await setDoc(
      deviceRef,
      {
        ...info,
        firstSeen: Timestamp.fromMillis(info.firstSeen),
        lastSeen: Timestamp.fromMillis(info.lastSeen),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to save device info:', error);
    throw error;
  }
}

/**
 * Get device info
 */
export async function getDeviceInfo(mac: string): Promise<DeviceInfo | null> {
  try {
    const deviceRef = doc(db, 'devices', mac);
    const docSnap = await getDoc(deviceRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        firstSeen: data.firstSeen.toMillis(),
        lastSeen: data.lastSeen.toMillis(),
      } as DeviceInfo;
    }

    return null;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
}

/**
 * Get all devices
 */
export async function getAllDevices(): Promise<DeviceInfo[]> {
  try {
    const devicesRef = collection(db, 'devices');
    const querySnapshot = await getDocs(devicesRef);
    const devices: DeviceInfo[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.mac) {
        devices.push({
          ...data,
          firstSeen: data.firstSeen?.toMillis() || Date.now(),
          lastSeen: data.lastSeen?.toMillis() || Date.now(),
        } as DeviceInfo);
      }
    });

    return devices;
  } catch (error) {
    console.error('Failed to get all devices:', error);
    return [];
  }
}

/**
 * Subscribe to device stats changes
 */
export function subscribeToDeviceStats(
  mac: string,
  callback: (stats: DeviceStats | null) => void
): () => void {
  const deviceRef = doc(db, 'devices', mac, 'current', 'latest');

  return onSnapshot(
    deviceRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          ...data,
          lastUpdate: data.lastUpdate.toMillis(),
        } as DeviceStats);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to device stats:', error);
      callback(null);
    }
  );
}

/**
 * Subscribe to all devices current stats
 */
export function subscribeToAllDevicesStats(
  callback: (devices: DeviceStats[]) => void
): () => void {
  const devicesRef = collection(db, 'devices');

  return onSnapshot(
    devicesRef,
    async (snapshot) => {
      const devices: DeviceStats[] = [];

      for (const deviceDoc of snapshot.docs) {
        const currentRef = doc(db, 'devices', deviceDoc.id, 'current', 'latest');
        const currentSnap = await getDoc(currentRef);

        if (currentSnap.exists()) {
          const data = currentSnap.data();
          devices.push({
            ...data,
            lastUpdate: data.lastUpdate.toMillis(),
          } as DeviceStats);
        }
      }

      callback(devices);
    },
    (error) => {
      console.error('Error subscribing to all devices:', error);
      callback([]);
    }
  );
}

/**
 * Calculate daily usage aggregation
 */
export async function calculateDailyUsage(
  mac: string,
  date: string
): Promise<DailyUsage | null> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshots = await getUsageHistory(
      mac,
      startOfDay.getTime(),
      endOfDay.getTime()
    );

    if (snapshots.length === 0) {
      return null;
    }

    const firstSnapshot = snapshots[0];
    const lastSnapshot = snapshots[snapshots.length - 1];

    const totalRx = lastSnapshot.rx - firstSnapshot.rx;
    const totalTx = lastSnapshot.tx - firstSnapshot.tx;

    const avgDownloadSpeed =
      snapshots.reduce((sum, s) => sum + s.downloadSpeed, 0) / snapshots.length;
    const avgUploadSpeed =
      snapshots.reduce((sum, s) => sum + s.uploadSpeed, 0) / snapshots.length;
    const avgPing =
      snapshots.reduce((sum, s) => sum + s.ping, 0) / snapshots.length;

    const peakDownloadSpeed = Math.max(...snapshots.map((s) => s.downloadSpeed));
    const peakUploadSpeed = Math.max(...snapshots.map((s) => s.uploadSpeed));

    return {
      date,
      totalRx,
      totalTx,
      avgDownloadSpeed,
      avgUploadSpeed,
      avgPing,
      peakDownloadSpeed,
      peakUploadSpeed,
    };
  } catch (error) {
    console.error('Failed to calculate daily usage:', error);
    return null;
  }
}
