'use client';

import { SMSMessage } from '@/lib/types';
import { formatSMSDate } from '@/lib/utils/decode-sms';
import { X, MessageSquare, Inbox } from 'lucide-react';

interface SMSPanelProps {
  messages: SMSMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function SMSPanel({ messages, isOpen, onClose }: SMSPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Inbox className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">No messages</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
              >
                {/* Sender & Date */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {message.number}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatSMSDate(message.date)}
                  </span>
                </div>

                {/* Message Content */}
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {(message as any).decodedContent || message.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
