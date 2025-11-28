'use client';

import { BatteryDailyUsage } from '@/lib/types';
import { formatDuration } from '@/lib/utils/format-duration';

interface BatteryUsageChartProps {
  data: BatteryDailyUsage[];
  type: 'weekly' | 'yearly';
  className?: string;
}

export function BatteryUsageChart({ data, type, className = '' }: BatteryUsageChartProps) {
  const maxDuration = Math.max(...data.map(d => d.duration), 1);

  // For weekly view, ensure we have Mon-Sun (7 days)
  let displayData = data;
  if (type === 'weekly') {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    displayData = weekDays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = data.find(d => d.date === dateStr);
      return existing || {
        date: dateStr,
        duration: 0,
        sessions: 0,
        averageLevel: 0,
      };
    });
  }
  
  // For yearly view, aggregate by month
  if (type === 'yearly') {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Group data by month
    const monthlyData = monthNames.map((monthName, monthIndex) => {
      const monthData = data.filter(d => {
        const date = new Date(d.date);
        return date.getFullYear() === currentYear && date.getMonth() === monthIndex;
      });
      
      const totalDuration = monthData.reduce((sum, d) => sum + d.duration, 0);
      const totalSessions = monthData.reduce((sum, d) => sum + d.sessions, 0);
      const avgLevel = monthData.length > 0
        ? Math.round(monthData.reduce((sum, d) => sum + d.averageLevel, 0) / monthData.length)
        : 0;
      
      return {
        date: `${currentYear}-${(monthIndex + 1).toString().padStart(2, '0')}-01`,
        duration: totalDuration,
        sessions: totalSessions,
        averageLevel: avgLevel,
        monthName,
      };
    });
    
    displayData = monthlyData;
  }

  // Check if there's any real data
  const hasData = displayData.some(d => d.duration > 0);

  return (
    <div className={`${className} relative`}>
      {/* Overlay "No Data Available" text when there's no data */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p className="text-sm text-gray-400 dark:text-gray-500">No Data Available</p>
        </div>
      )}
      
      {/* Always show the skeleton bars */}
      <div className="flex items-end justify-between gap-1 md:gap-2 h-full">
        {displayData.map((day, index) => {
            const heightPercent = (day.duration / maxDuration) * 100;
            const date = new Date(day.date);
            const dayLabel = type === 'weekly' 
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]
              : (day as any).monthName || date.getDate().toString();

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 md:gap-2 min-w-0">
              {/* Bar */}
              <div className="w-full flex flex-col justify-end items-center" style={{ height: '200px' }}>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 relative group ${
                    day.duration > 0 
                      ? 'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500' 
                      : 'bg-gray-200 dark:bg-gray-700 opacity-30'
                  }`}
                  style={{ height: `${heightPercent}%`, minHeight: day.duration > 0 ? '4px' : '8px' }}
                >
                  {/* Tooltip */}
                  {day.duration > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <div className="font-semibold">{formatDuration(day.duration, true)}</div>
                        <div className="text-gray-300">{day.sessions} session{day.sessions !== 1 ? 's' : ''}</div>
                        {day.averageLevel > 0 && (
                          <div className="text-gray-300">Avg: {day.averageLevel}%</div>
                        )}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="text-center min-w-0 w-full">
                <div className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {dayLabel}
                </div>
                {day.duration > 0 && (
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatDuration(day.duration, true)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
