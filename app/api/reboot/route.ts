import { NextResponse } from 'next/server';
import net from 'net';

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;

/**
 * Fetch data from router using raw socket
 */
function fetchFromRouter(path: string, method: string = 'GET', body?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(ROUTER_PORT, ROUTER_HOST, () => {
      let request = '';
      if (method === 'POST' && body) {
        request = `POST ${path} HTTP/1.1\r\nHost: ${ROUTER_HOST}\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: ${body.length}\r\nConnection: close\r\n\r\n${body}`;
      } else {
        request = `GET ${path} HTTP/1.1\r\nHost: ${ROUTER_HOST}\r\nConnection: close\r\n\r\n`;
      }
      socket.write(request);
    });

    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('end', () => {
      try {
        console.log('[Reboot API] Raw response:', data);
        
        // Extract JSON from HTTP response
        const bodyStart = data.indexOf('\r\n\r\n');
        if (bodyStart === -1) {
          console.log('[Reboot API] No body separator found, treating as success');
          resolve({ success: true });
          return;
        }

        const body = data.substring(bodyStart + 4).trim();
        console.log('[Reboot API] Response body:', body);

        if (!body) {
          console.log('[Reboot API] Empty body, treating as success');
          resolve({ success: true });
          return;
        }

        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (parseError) {
          console.log('[Reboot API] Not JSON, treating as success. Body:', body);
          resolve({ success: true, raw: body });
        }
      } catch (error) {
        console.error('[Reboot API] Parse error:', error);
        // Don't reject, just resolve with success since reboot command was sent
        resolve({ success: true });
      }
    });

    socket.on('error', (error) => {
      console.error('[Reboot API] Socket error:', error);
      reject(error);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error('Socket timeout'));
    });
  });
}

export async function POST() {
  try {
    // Send the reboot command
    const REBOOT_PATH = `/reqproc/proc_post`;
    const rebootBody = 'isTest=false&goformId=REBOOT_DEVICE';
    
    console.log('[Reboot API] Initiating reboot...');
    console.log('[Reboot API] Request path:', REBOOT_PATH);
    console.log('[Reboot API] Request body:', rebootBody);
    
    const rebootData = await fetchFromRouter(REBOOT_PATH, 'POST', rebootBody);
    
    console.log('[Reboot API] Reboot response:', JSON.stringify(rebootData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Reboot initiated successfully',
      data: rebootData
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[Reboot API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reboot router',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
