'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Square, Wifi } from 'lucide-react';

interface PingerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PingerDialog({ isOpen, onClose }: PingerDialogProps) {
  const [target, setTarget] = useState('8.8.8.8');
  const [count, setCount] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleStart = async () => {
    if (!target.trim()) {
      addLog('❌ Error: Please enter a target IP or hostname');
      return;
    }

    setIsRunning(true);
    setLogs([]);
    addLog(`🚀 Starting ping to ${target} (${count} packets)...`);

    try {
      const response = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, count }),
      });

      if (!response.ok) {
        throw new Error('Ping request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            try {
              const data = JSON.parse(line);
              if (data.type === 'status') {
                addLog(`📤 ${data.message}`);
              } else if (data.type === 'result') {
                addLog(`✅ Packet ${data.packet}: Reply from ${data.host}: time=${data.time}ms`);
              } else if (data.type === 'error') {
                addLog(`❌ Packet ${data.packet || ''}: ${data.message}`);
              } else if (data.type === 'complete') {
                addLog(`✨ Ping complete! Sent: ${data.sent}, Received: ${data.received}`);
              }
            } catch (e) {
              // Ignore parse errors
            }
          });
        }
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
      addLog('🏁 Finished');
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog('⏹️ Stopped by user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Network Pinger</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wake up your hotspot connection</p>
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
        <div className="p-6 space-y-4 flex-1 overflow-auto">
          {/* Input Fields - Horizontal Layout */}
          <div className="grid grid-cols-3 gap-3">
            {/* Target Input */}
            <div className="col-span-2">
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target IP or Hostname
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isRunning}
                placeholder="e.g., 8.8.8.8"
                className="w-full px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Count Input */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Count
              </label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 4)))}
                disabled={isRunning}
                min="1"
                max="20"
                className="w-full px-2 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Ping
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <Square className="w-5 h-5" />
                Stop
              </button>
            )}
          </div>

          {/* Logs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logs
            </label>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-300 dark:border-gray-700">
              {logs.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No logs yet. Click "Start Ping" to begin.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-600 dark:text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
