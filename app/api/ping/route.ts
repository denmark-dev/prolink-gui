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

        // Send packets one at a time with 1 second delay
        let sent = 0;
        let received = 0;

        for (let i = 1; i <= count; i++) {
          try {
            // Send status update
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'status',
              message: `Sending packet ${i}/${count}...`
            }) + '\n'));

            // Execute single ping
            const command = `ping -n 1 ${target}`;
            console.log(`[Ping API] Executing packet ${i}:`, command);

            const { stdout } = await execAsync(command);
            const lines = stdout.split('\n');
            sent++;

            let packetReceived = false;
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // Parse reply lines
              if (trimmedLine.includes('Reply from') || trimmedLine.includes('bytes=')) {
                const timeMatch = trimmedLine.match(/time[=<](\d+)ms/i);
                const hostMatch = trimmedLine.match(/Reply from ([^\s:]+)/i);
                
                if (timeMatch) {
                  received++;
                  packetReceived = true;
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'result',
                    packet: i,
                    host: hostMatch ? hostMatch[1] : target,
                    time: timeMatch[1],
                    line: trimmedLine
                  }) + '\n'));
                }
              }

              // Handle timeout/unreachable
              if (trimmedLine.includes('Request timed out') || trimmedLine.includes('Destination host unreachable')) {
                controller.enqueue(encoder.encode(JSON.stringify({
                  type: 'error',
                  packet: i,
                  message: trimmedLine
                }) + '\n'));
              }
            }

            // Wait 1 second before next packet (except for last one)
            if (i < count) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

          } catch (error) {
            console.error(`[Ping API] Error on packet ${i}:`, error);
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'error',
              packet: i,
              message: error instanceof Error ? error.message : 'Ping failed'
            }) + '\n'));
          }
        }

        // Send completion
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'complete',
          sent: sent,
          received: received
        }) + '\n'));

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
