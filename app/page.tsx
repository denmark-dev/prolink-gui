'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useRouterData } from '@/lib/hooks/useRouterData';
import { useHotspotUsage } from '@/lib/hooks/useHotspotUsage';
import { useSystemStatus } from '@/lib/hooks/useSystemStatus';
import { useBatteryTracking } from '@/lib/hooks/useBatteryTracking';
import { DeviceCard } from '@/components/DeviceCard';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { BatteryUsageChart } from '@/components/charts/BatteryUsageChart';
import { formatBytes, formatSpeed } from '@/lib/utils/format';
import { formatDuration } from '@/lib/utils/format-duration';
import { parseUptime } from '@/lib/utils/parse-uptime';
import { Wifi, Activity, HardDrive, Calendar, TrendingUp, Battery, BatteryCharging, Clock, Zap, Power, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { PingerDialog } from '@/components/PingerDialog';
import { SpeedTestDialog } from '@/components/SpeedTestDialog';
import { RebootDialog } from '@/components/RebootDialog';

export default function Dashboard() {
  const router = useRouter();
  const enableFirestore = false; // Disabled due to quota limits - enable only when needed
  const [isPingerOpen, setIsPingerOpen] = useState(false);
  const [isSpeedTestOpen, setIsSpeedTestOpen] = useState(false);
  const [isRebootOpen, setIsRebootOpen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  
  const { devices, loading, error, lastUpdate, refresh } = useRouterData({
    refreshInterval: 2000,
    enableFirestore,
  });

  const { status: systemStatus } = useSystemStatus(5000);

  // Debug: Log system status
  console.log('[Dashboard] System Status:', systemStatus);

  const totalDownloadSpeed = devices.reduce((sum, d) => sum + d.downloadSpeed, 0);
  const totalUploadSpeed = devices.reduce((sum, d) => sum + d.uploadSpeed, 0);
  const totalDownloaded = devices.reduce((sum, d) => sum + d.rx, 0);
  const totalUploaded = devices.reduce((sum, d) => sum + d.tx, 0);
  const totalUsage = totalDownloaded + totalUploaded;
  const avgPing = devices.length > 0
    ? Math.round(devices.reduce((sum, d) => sum + d.ping, 0) / devices.length)
    : 0;

  // Track hotspot usage
  const { usage } = useHotspotUsage({
    enableFirestore,
    totalDownloaded,
    totalUploaded,
    peakDownloadSpeed: totalDownloadSpeed,
    peakUploadSpeed: totalUploadSpeed,
    deviceCount: devices.filter(d => d.isConnected).length,
  });

  // Track battery usage
  const batteryLevel = systemStatus?.battery_vol_percent ? parseInt(systemStatus.battery_vol_percent) : 0;
  const isCharging = systemStatus?.battery_charging === '1';
  const routerUptime = systemStatus?.realtime_time ? parseInt(systemStatus.realtime_time) : 0;
  
  // Debug: Log system status to see available fields
  console.log('[Dashboard] System Status Full Data:', systemStatus);
  console.log('[Dashboard] Realtime_time field:', systemStatus?.realtime_time);
  console.log('[Dashboard] Router uptime (seconds):', routerUptime);
  
  const { stats: batteryStats, weeklyUsage: batteryWeekly, monthlyUsage: batteryMonthly } = useBatteryTracking({
    enableFirestore,
    currentLevel: batteryLevel,
    isCharging,
    routerUptime,
  });

  // Show loading screen on initial load
  if (loading && devices.length === 0) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={refresh}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex flex-col gap-2 mb-2">
              <Image
                src="/prolink.png"
                alt="Prolink"
                width={200}
                height={60}
                className="object-contain"
                priority
                unoptimized
                key={Date.now()}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Model: PRT7011L
              </p>
            </div>
            <div className="flex items-center gap-3">
              {systemStatus && (systemStatus.spn_name_data || systemStatus.network_provider) && (
                <Badge variant="info" className="text-base px-3 py-1">
                  <Wifi className="w-4 h-4 mr-2 inline" />
                  {systemStatus.spn_name_data || systemStatus.network_provider || 'Unknown'}
                </Badge>
              )}
              {systemStatus?.battery_vol_percent && (
                <Badge 
                  variant={systemStatus.battery_charging === '1' ? 'success' : 'default'}
                  className="text-base px-3 py-1"
                >
                  {systemStatus.battery_charging === '1' ? (
                    <BatteryCharging className="w-4 h-4 mr-2 inline" />
                  ) : (
                    <Battery className="w-4 h-4 mr-2 inline" />
                  )}
                  {(() => {
                    const volume = parseInt(systemStatus.battery_vol_percent);
                    const filledBars = Math.ceil(volume / 25); // 1-4 bars based on 0-100 range
                    const totalBars = 4;
                    const emptyBars = totalBars - filledBars;
                    return (
                      <span style={{ letterSpacing: '0.25em' }}>
                        <span className="text-current">{'█'.repeat(Math.max(0, filledBars))}</span>
                        <span className="opacity-30">{'█'.repeat(Math.max(0, emptyBars))}</span>
                      </span>
                    );
                  })()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tools Section - Collapsible */}
        <Card className="mb-8">
          <div 
            className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => setIsToolsExpanded(!isToolsExpanded)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tools</CardTitle>
                <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  {isToolsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>
            </CardHeader>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isToolsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pinger Tool */}
                <button
                  onClick={() => setIsPingerOpen(true)}
                  className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Wifi className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Network Pinger</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Wake up hotspot</p>
                    </div>
                  </div>
                </button>

                {/* Speed Test Tool */}
                <button
                  onClick={() => setIsSpeedTestOpen(true)}
                  className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Speed Test</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Test download speed</p>
                    </div>
                  </div>
                </button>

                {/* Reboot Tool */}
                <button
                  onClick={() => setIsRebootOpen(true)}
                  className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-600 rounded-lg group-hover:scale-110 transition-transform">
                      <Power className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reboot Router</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Restart your router</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Network Statistics - Main Card */}
        <Card className="mb-8 border-2 border-blue-500 dark:border-blue-600 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Network Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3">Avg Ping</p>
                <p className="text-2xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {avgPing > 0 ? `${avgPing}ms` : 'N/A'}
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3">Download</p>
                <p className="text-2xl md:text-4xl font-bold text-green-600 dark:text-green-400">
                  {formatSpeed(totalDownloadSpeed)}
                </p>
              </div>
              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3">Upload</p>
                <p className="text-2xl md:text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {formatSpeed(totalUploadSpeed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Stats - Grouped Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Global Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Connected Devices */}
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {devices.filter(d => d.isConnected).length}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Connected</p>
              </div>

              {/* Total Downloaded */}
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {formatBytes(totalDownloaded)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Downloaded</p>
              </div>

              {/* Total Uploaded */}
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {formatBytes(totalUploaded)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Uploaded</p>
              </div>

              {/* Total Usage */}
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <HardDrive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {formatBytes(totalUsage)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Periods - Grouped Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Daily Usage */}
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {usage.daily ? formatBytes(usage.daily.totalUsage) : '0 B'}
                </p>
                <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-1">Daily</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
                  Midnight reset
                </p>
              </div>

              {/* Weekly Usage */}
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {formatBytes(usage.weekly)}
                </p>
                <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-1">Weekly</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
                  Past 7 days
                </p>
              </div>

              {/* Monthly Usage */}
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <HardDrive className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {formatBytes(usage.monthly)}
                </p>
                <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-1">Monthly</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400">
                  Current month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Life Tracking */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mobile Hotspot Battery Life</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Current Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Battery Level */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                {isCharging ? (
                  <BatteryCharging className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                ) : (
                  <Battery className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Battery Level</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {batteryLevel}%
                </p>
                {isCharging && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Charging</p>
                )}
              </div>

              {/* Current Session Duration */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Running</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDuration(batteryStats.currentSessionDuration, true)}
                </p>
              </div>

              {/* Today's Duration */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatDuration(batteryStats.todayDuration, true)}
                </p>
              </div>

              {/* Average Daily */}
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Daily</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {formatDuration(batteryStats.averageDailyDuration, true)}
                </p>
              </div>
            </div>

            {/* Usage Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Usage (Mon-Sun) */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  This Week (Mon-Sun)
                </h3>
                <BatteryUsageChart 
                  data={batteryWeekly} 
                  type="weekly"
                  className="h-64"
                />
              </div>

              {/* Yearly Usage */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                  This Year (Jan-Dec)
                </h3>
                <BatteryUsageChart 
                  data={batteryMonthly} 
                  type="yearly"
                  className="h-64"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Devices */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && devices.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">Loading devices...</p>
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-12">
                <Wifi className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No devices connected</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                  <DeviceCard
                    key={device.mac}
                    device={device}
                    onClick={() => router.push(`/device/${encodeURIComponent(device.mac)}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Last Update */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400" suppressHydrationWarning>
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>

      {/* Pinger Dialog */}
      <PingerDialog 
        isOpen={isPingerOpen}
        onClose={() => setIsPingerOpen(false)}
      />

      {/* Speed Test Dialog */}
      <SpeedTestDialog 
        isOpen={isSpeedTestOpen}
        onClose={() => setIsSpeedTestOpen(false)}
      />

      {/* Reboot Dialog */}
      <RebootDialog 
        isOpen={isRebootOpen}
        onClose={() => setIsRebootOpen(false)}
      />
    </div>
  );
}
