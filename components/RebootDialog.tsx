'use client';

import { useState, useEffect } from 'react';
import { Power, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface RebootDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type RebootStatus = 'confirming' | 'rebooting' | 'waiting' | 'checking' | 'success' | 'error';

export function RebootDialog({ isOpen, onClose }: RebootDialogProps) {
  const [status, setStatus] = useState<RebootStatus>('confirming');
  const [message, setMessage] = useState('Are you sure you want to reboot the router?');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleReboot = async () => {
    try {
      setStatus('rebooting');
      setMessage('Sending reboot command...');

      // Send reboot command
      const response = await fetch('/api/reboot', {
        method: 'POST',
      });

      console.log('[Reboot Dialog] Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('[Reboot Dialog] Response data:', data);
      } catch (parseError) {
        console.log('[Reboot Dialog] Failed to parse JSON, assuming success');
        data = { success: true };
      }

      if (!response.ok && response.status !== 200) {
        throw new Error(data.message || 'Reboot request failed');
      }

      setMessage('Reboot command sent successfully!');
      
      // Wait for router to disconnect
      setStatus('waiting');
      setMessage('Router is rebooting... Please wait.');
      setCountdown(30); // 30 seconds countdown

      // Wait 30 seconds for router to reboot
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Show success with reconnect option
      setStatus('success');
      setMessage('Reboot complete! Click "Reconnect" to check connection or "OK" to close.');

    } catch (error) {
      console.error('[Reboot] Error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to reboot router');
    }
  };

  const handleCancel = () => {
    if (status === 'confirming') {
      onClose();
    }
  };

  const handleReconnect = async () => {
    setStatus('checking');
    setMessage('Checking connection...');

    try {
      const response = await fetch('/api/router', {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Connected! Refreshing page...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setStatus('waiting');
        setMessage('Router is still rebooting. Please wait a moment and try again.');
        setCountdown(10);
      }
    } catch (error) {
      setStatus('waiting');
      setMessage('Router is still rebooting. Please wait a moment and try again.');
      setCountdown(10);
    }
  };

  const handleOk = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === 'confirming' && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Power className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            )}
            {(status === 'rebooting' || status === 'waiting' || status === 'checking') && (
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'confirming' && 'Reboot Router'}
              {status === 'rebooting' && 'Rebooting...'}
              {status === 'waiting' && 'Please Wait'}
              {status === 'checking' && 'Reconnecting...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          {/* Countdown */}
          {status === 'waiting' && countdown > 0 && (
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                {countdown}s
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Estimated time remaining
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {(status === 'rebooting' || status === 'waiting' || status === 'checking') && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
          )}

          {/* Buttons */}
          {status === 'confirming' && (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReboot}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Reboot Now
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex gap-3">
              <button
                onClick={handleOk}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                OK
              </button>
              <button
                onClick={handleReconnect}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Reconnect
              </button>
            </div>
          )}

          {status === 'error' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          )}

          {/* Info */}
          {status === 'confirming' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> The router will be unavailable for about 1-2 minutes during the reboot process.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
