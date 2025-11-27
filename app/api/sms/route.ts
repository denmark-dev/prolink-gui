import { NextResponse } from 'next/server';
import net from 'net';

console.log('===============================================');
console.log('[SMS API] Route file loaded!');
console.log('===============================================');

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;

// Store session cookie (shared with main router API)
let sessionCookie: string | null = null;

/**
 * Login to router and get session cookie
 */
function loginToRouter(): Promise<string | null> {
  return new Promise((resolve) => {
    console.log('[SMS API] Attempting login...');
    const socket = net.createConnection(ROUTER_PORT, ROUTER_HOST, () => {
      const credentials = 'username=YWRtaW4%3D&password=YWRtaW4%3D';
      const request = `POST /reqproc/proc_post HTTP/1.1\r\nHost: ${ROUTER_HOST}\r\nContent-Type: application/x-www-form-urlencoded\r\nContent-Length: ${credentials.length}\r\nConnection: close\r\n\r\n${credentials}`;
      socket.write(request);
    });

    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('end', () => {
      const cookieMatch = data.match(/Set-Cookie: ([^;]+)/);
      if (cookieMatch) {
        sessionCookie = cookieMatch[1];
        console.log('[SMS API] Login successful');
        resolve(sessionCookie);
      } else {
        console.log('[SMS API] Login failed - no cookie');
        resolve(null);
      }
    });

    socket.on('error', (error) => {
      console.error('[SMS API] Login error:', error);
      resolve(null);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Fetch data from router using raw socket
 */
function fetchFromRouter(path: string, cookie: string | null): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(ROUTER_PORT, ROUTER_HOST, () => {
      const cookieHeader = cookie ? `Cookie: ${cookie}\r\n` : '';
      const request = `GET ${path} HTTP/1.1\r\nHost: ${ROUTER_HOST}\r\n${cookieHeader}Connection: close\r\n\r\n`;
      socket.write(request);
    });

    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('end', () => {
      try {
        const bodyStart = data.indexOf('\r\n\r\n');
        if (bodyStart === -1) {
          resolve({});
          return;
        }

        const body = data.substring(bodyStart + 4);
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (error) {
        console.error('[SMS API] Parse error:', error);
        resolve({});
      }
    });

    socket.on('error', (error) => {
      console.error('[SMS API] Socket error:', error);
      reject(error);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error('Socket timeout'));
    });
  });
}

export async function GET() {
  try {
    const timestamp = Date.now();
    const SMS_PATH = `/reqproc/proc_get?isTest=false&cmd=sms_data_total&page=0&data_per_page=500&mem_store=1&tags=10&order_by=order+by+id+desc&_=${timestamp}`;
    
    console.log('[SMS API] Fetching SMS messages...');
    console.log('[SMS API] Request path:', SMS_PATH);
    console.log('[SMS API] Trying without cookie first (like main API)...');
    
    // Try without cookie first (router seems to allow some endpoints without auth)
    const smsData = await fetchFromRouter(SMS_PATH, null);
    
    console.log('[SMS API] Raw SMS data received:', JSON.stringify(smsData, null, 2));
    console.log('[SMS API] Message count:', smsData.messages?.length || 0);

    // If we got an empty response, try with login
    if (!smsData.messages && !sessionCookie) {
      console.log('[SMS API] Empty response, trying with login...');
      sessionCookie = await loginToRouter();
      if (sessionCookie) {
        const retryData = await fetchFromRouter(SMS_PATH, sessionCookie);
        console.log('[SMS API] Retry with cookie - data:', JSON.stringify(retryData, null, 2));
        return NextResponse.json(retryData, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
    }

    return NextResponse.json(smsData, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[SMS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS messages', messages: [] },
      { status: 500 }
    );
  }
}
