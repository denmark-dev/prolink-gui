import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { target, count = 4 } = body;

        if (!target) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: 'Target is required'
          }) + '\n'));
          controller.close();
          return;
        }

        // Validate target (basic validation)
        const validTarget = /^[a-zA-Z0-9.-]+$/.test(target);
        if (!validTarget) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: 'Invalid target format'
          }) + '\n'));
          controller.close();
          return;
        }

        // Use Windows ping command
        const command = `ping -n ${count} ${target}`;
        
        console.log('[Ping API] Executing:', command);

        try {
          const { stdout } = await execAsync(command);
          const lines = stdout.split('\n');
          
          let sent = 0;
          let received = 0;

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Parse reply lines
            if (trimmedLine.includes('Reply from') || trimmedLine.includes('bytes=')) {
              const timeMatch = trimmedLine.match(/time[=<](\d+)ms/i);
              const hostMatch = trimmedLine.match(/Reply from ([^\s:]+)/i);
              
              if (timeMatch) {
                received++;
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'result',
                  host: hostMatch ? hostMatch[1] : target,
                  time: timeMatch[1],
                  line: trimmedLine
                }) + '\n'));
              }
            }
            
            // Parse statistics
            if (trimmedLine.includes('Packets: Sent =')) {
              const sentMatch = trimmedLine.match(/Sent = (\d+)/);
              const receivedMatch = trimmedLine.match(/Received = (\d+)/);
              if (sentMatch) sent = parseInt(sentMatch[1]);
              if (receivedMatch) received = parseInt(receivedMatch[1]);
            }

            // Handle timeout/unreachable
            if (trimmedLine.includes('Request timed out') || trimmedLine.includes('Destination host unreachable')) {
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'error',
                message: trimmedLine
              }) + '\n'));
            }
          }

          // Send completion
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'complete',
            sent: sent || count,
            received: received
          }) + '\n'));

        } catch (error) {
          console.error('[Ping API] Error:', error);
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Ping failed'
          }) + '\n'));
        }

        controller.close();
      } catch (error) {
        console.error('[Ping API] Request error:', error);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          message: 'Invalid request'
        }) + '\n'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
