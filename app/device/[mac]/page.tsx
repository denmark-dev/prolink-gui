'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceStats } from '@/lib/hooks/useDeviceStats';
import { useUsageHistory } from '@/lib/hooks/useUsageHistory';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SpeedChart } from '@/components/charts/SpeedChart';
import { UsageChart } from '@/components/charts/UsageChart';
import { formatBytes, formatSpeed, getSignalStrength } from '@/lib/utils/format';
import { ArrowLeft, Wifi, Activity, HardDrive, Clock, Monitor } from 'lucide-react';
import { TimeRange } from '@/lib/types';

interface PageProps {
  params: Promise<{ mac: string }>;
}

export default function DeviceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const mac = decodeURIComponent(resolvedParams.mac);
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');

  const { stats, loading: statsLoading } = useDeviceStats(mac);
  const { snapshots, dailyUsage, loading: historyLoading } = useUsageHistory(mac, timeRange);

  const signalInfo = stats ? getSignalStrength(stats.rssi) : null;
  const totalUsage = stats ? stats.rx + stats.tx : 0;

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading device details...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Device Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The device with MAC address {mac} is not currently connected.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
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
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Device Hero Section */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Device Icon */}
              <div className="w-32 h-32 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Monitor className="w-16 h-16 text-white" strokeWidth={1.5} />
              </div>

              {/* Device Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stats.hostname}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4 font-mono text-sm">
                  {stats.mac}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {signalInfo && (
                    <Badge
                      variant={
                        signalInfo.label === 'Excellent' || signalInfo.label === 'Good'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      <Wifi className="w-3 h-3 mr-1 inline" />
                      {signalInfo.label} ({stats.rssi} dBm)
                    </Badge>
                  )}
                  {stats.ip && <Badge variant="default">IP: {stats.ip}</Badge>}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-row gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl min-w-[150px]">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Download</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatSpeed(stats.downloadSpeed)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl min-w-[150px]">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Upload</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatSpeed(stats.uploadSpeed)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <HardDrive className="w-8 h-8 mx-auto mb-3 text-orange-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(totalUsage)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ping</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.ping > 0 ? `${stats.ping}ms` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Last Seen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date(stats.lastUpdate).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center gap-2 mb-6">
          {(['today', '7days', '30days'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                timeRange === range
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {range === 'today' ? 'Today' : range === '7days' ? 'Past 7 Days' : 'Past 30 Days'}
            </button>
          ))}
        </div>

        {/* Speed History Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Speed History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Activity className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : snapshots.length > 0 ? (
              <SpeedChart data={snapshots} className="h-80" />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No data available for this time range
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Activity className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : dailyUsage.length > 0 ? (
              <UsageChart data={dailyUsage} className="h-80" />
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No usage data available for this time range
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Timeline */}
        {dailyUsage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyUsage.map((daily) => (
                  <div
                    key={daily.date}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(daily.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Avg Speed: {formatSpeed(daily.avgDownloadSpeed)} ↓ /{' '}
                        {formatSpeed(daily.avgUploadSpeed)} ↑
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {formatBytes(daily.totalRx + daily.totalTx)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Peak: {formatSpeed(daily.peakDownloadSpeed)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
