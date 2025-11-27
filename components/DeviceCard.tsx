'use client';

import { DeviceStats } from '@/lib/types';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { formatSpeed, formatBytes, getSignalStrength } from '@/lib/utils/format';
import { formatDuration } from '@/lib/utils/format-duration';
import { Wifi, ArrowDown, ArrowUp, Activity, Monitor, Clock, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DeviceCardProps {
  device: DeviceStats;
  onClick?: () => void;
}

export function DeviceCard({ device, onClick }: DeviceCardProps) {
  const signalInfo = getSignalStrength(device.rssi);
  const totalUsage = device.rx + device.tx;
  const isDisconnected = !device.isConnected;
  
  // Live duration counter
  const [liveDuration, setLiveDuration] = useState(device.connectionTime || 0);
  
  useEffect(() => {
    if (device.connectionTime) {
      setLiveDuration(device.connectionTime);
      
      // Update duration every second
      const interval = setInterval(() => {
        setLiveDuration(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [device.connectionTime]);

  return (
    <Card 
      hover={!isDisconnected} 
      onClick={isDisconnected ? undefined : onClick} 
      className={`overflow-hidden ${isDisconnected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <CardContent className="p-6">
        {/* Device Icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-24 h-24 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
            <Monitor className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Device Name */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2 truncate">
          {device.hostname}
        </h3>

        {/* Signal Strength */}
        <div className="flex justify-center mb-3">
          <Badge variant={signalInfo.label === 'Excellent' || signalInfo.label === 'Good' ? 'success' : 'warning'}>
            <Wifi className="w-3 h-3 mr-1 inline" />
            {signalInfo.label}
          </Badge>
        </div>

        {/* Active Duration - Live Counter */}
        {liveDuration > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">Active Duration</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {formatDuration(liveDuration, true)}
              </span>
            </div>
          </div>
        )}

        {/* Real-time Speed Stats - Horizontal Layout */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Download Speed */}
          <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <ArrowDown className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatSpeed(device.downloadSpeed)}
            </span>
          </div>

          {/* Upload Speed */}
          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <ArrowUp className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatSpeed(device.uploadSpeed)}
            </span>
          </div>

          {/* Ping */}
          <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {device.ping > 0 ? `${device.ping}ms` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Total Consumed Data */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Total Downloaded */}
          <div className="flex flex-col items-center p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">Downloaded</span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400">
              {formatBytes(device.rx)}
            </span>
          </div>

          {/* Total Uploaded */}
          <div className="flex flex-col items-center p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
            <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">Uploaded</span>
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              {formatBytes(device.tx)}
            </span>
          </div>
        </div>

        {/* Total Usage */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Usage</span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {formatBytes(totalUsage)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
