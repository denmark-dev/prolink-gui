'use client';

import { useState } from 'react';
import { X, Zap, Play, Square } from 'lucide-react';

interface SpeedTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpeedTestDialog({ isOpen, onClose }: SpeedTestDialogProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Ready to test');

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1) {
      return `${mbps.toFixed(2)} Mbps`;
    }
    return `${(mbps * 1024).toFixed(2)} Kbps`;
  };

  const handleStart = async () => {
    setIsRunning(true);
    setCurrentSpeed(0);
    setAverageSpeed(0);
    setMaxSpeed(0);
    setProgress(0);
    setStatus('Starting speed test...');

    try {
      const testDurationMs = 10000; // 10 seconds
      const startTime = Date.now();
      let totalBytes = 0;
      const speeds: number[] = [];

      setStatus('Testing download speed...');

      // Use a larger test file for better accuracy
      const testSizes = [5, 10, 25]; // MB
      let testIndex = 0;

      while (Date.now() - startTime < testDurationMs) {
        const chunkStart = Date.now();
        const testSize = testSizes[testIndex % testSizes.length];
        
        try {
          // Use Cloudflare speed test endpoint
          const testUrl = `https://speed.cloudflare.com/__down?bytes=${testSize * 1024 * 1024}`;
          
          console.log('[SpeedTest] Downloading chunk:', testSize, 'MB');
          
          const response = await fetch(testUrl, {
            cache: 'no-store',
            mode: 'cors',
          });

          if (!response.ok) {
            console.error('[SpeedTest] Response not OK:', response.status);
            throw new Error('Download failed');
          }

          const reader = response.body?.getReader();
          let chunkBytes = 0;

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              chunkBytes += value.length;
              totalBytes += value.length;

              // Update speed in real-time
              const elapsed = (Date.now() - chunkStart) / 1000;
              if (elapsed > 0) {
                const currentSpeedMbps = (chunkBytes * 8) / (elapsed * 1000000);
                setCurrentSpeed(currentSpeedMbps);
              }
            }
          }

          const chunkDuration = (Date.now() - chunkStart) / 1000;
          
          if (chunkDuration > 0 && chunkBytes > 0) {
            const speedMbps = (chunkBytes * 8) / (chunkDuration * 1000000);
            
            console.log('[SpeedTest] Chunk complete:', {
              bytes: chunkBytes,
              duration: chunkDuration,
              speedMbps: speedMbps.toFixed(2)
            });
            
            speeds.push(speedMbps);
            setMaxSpeed(Math.max(...speeds));
            setAverageSpeed(speeds.reduce((a, b) => a + b, 0) / speeds.length);
          }
          
          const elapsed = Date.now() - startTime;
          setProgress(Math.min((elapsed / testDurationMs) * 100, 100));

          testIndex++;

        } catch (error) {
          console.error('[SpeedTest] Chunk error:', error);
          // Continue to next chunk instead of breaking
          testIndex++;
        }

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate final average
      if (speeds.length > 0) {
        const finalAverage = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        setAverageSpeed(finalAverage);
        setCurrentSpeed(finalAverage);
        setStatus('Test complete!');
      } else {
        setStatus('Test failed. No data received.');
      }
      
      setProgress(100);

    } catch (error) {
      console.error('[SpeedTest] Error:', error);
      setStatus('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setStatus('Test stopped by user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Speed Test</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Test your download speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-auto">
          {/* Speed Display */}
          <div className="text-center">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Speed</p>
              <p className="text-4xl md:text-5xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatSpeed(currentSpeed)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Status */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{status}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Average Speed</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatSpeed(averageSpeed)}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Max Speed</p>
              <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                {formatSpeed(maxSpeed)}
              </p>
            </div>
          </div>

          {/* Control Button */}
          <div>
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Test
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> This test downloads data from Cloudflare's speed test server. 
              Results may vary based on server location and network conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
