'use client';

import { useState, useEffect } from 'react';
import { SMSMessage } from '../types';
import { decodeSMSContent } from '../utils/decode-sms';

export function useSMS(refreshInterval: number = 30000) {
  console.log('[useSMS] Hook initialized, refresh interval:', refreshInterval);
  
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchSMS = async () => {
    try {
      console.log('[useSMS] Fetching SMS messages...');
      const response = await fetch('/api/sms');
      console.log('[useSMS] Response status:', response.status);
      
      const data = await response.json();
      console.log('[useSMS] Response data:', data);
      
      if (data.messages) {
        console.log('[useSMS] Found messages:', data.messages.length);
        // Decode message contents
        const decodedMessages = data.messages.map((msg: SMSMessage) => ({
          ...msg,
          decodedContent: decodeSMSContent(msg.content),
        }));
        
        console.log('[useSMS] Decoded messages:', decodedMessages);
        setMessages(decodedMessages);
        // Count unread (tag "1" = inbox)
        setUnreadCount(decodedMessages.filter((m: SMSMessage) => m.tag === '1').length);
      } else {
        console.log('[useSMS] No messages in response');
        setMessages([]);
      }
      
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('[useSMS] Error fetching SMS:', err);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSMS();
    
    const interval = setInterval(fetchSMS, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    messages,
    loading,
    error,
    unreadCount,
    refresh: fetchSMS,
  };
}
