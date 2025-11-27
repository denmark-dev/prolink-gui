import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import http from 'http';

// API endpoints
const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;
const STA_INFO_PATH = '/reqproc/proc_get?isTest=false&cmd=sta_info1%2Csta_info2%2Csta_info3%2Csta_info4%2Csta_info5%2Csta_info6&multi_data=1';
const STATION_LIST_PATH = '/reqproc/proc_get?isTest=false&cmd=station_list&multi_data=1';
const HOSTNAME_LIST_PATH = '/reqproc/proc_get?isTest=false&cmd=hostNameList';
const SYSTEM_STATUS_PATH = '/reqproc/proc_get?multi_data=1&isTest=false&cmd=network_provider%2Cspn_name_data%2Cbattery_charging%2Cbattery_vol_percent%2Cbattery_pers%2Csignalbar%2Cnetwork_type%2Csub_network_type%2Crealtime_time';
const SMS_PATH = '/reqproc/proc_get?isTest=false&cmd=sms_data_total&page=0&data_per_page=500&mem_store=1&tags=10&order_by=order+by+id+desc';
const LOGIN_PATH = '/reqproc/proc_post';

// Store session cookie (in production, use Redis or similar)
let sessionCookie: string | null = null;

/**
 * Login to router and get session cookie
 */
function loginToRouter(): Promise<string | null> {
  return new Promise((resolve) => {
    console.log('[Login] Starting login attempt...');
    const socket = new net.Socket();
    let responseData = '';
    let timeout: NodeJS.Timeout;

    timeout = setTimeout(() => {
      console.log('[Login] Timeout after 5 seconds');
      socket.destroy();
      resolve(null);
    }, 5000);

    socket.connect(ROUTER_PORT, ROUTER_HOST, () => {
      console.log('[Login] Connected, sending login request');
      
      // Base64 encode credentials and URL encode them
      const username = encodeURIComponent(Buffer.from('admin').toString('base64'));
      const password = encodeURIComponent(Buffer.from('password').toString('base64'));
      
      const body = `isTest=false&goformId=LOGIN&username=${username}&password=${password}`;
      
      const request = [
        `POST ${LOGIN_PATH} HTTP/1.1`,
        `Host: ${ROUTER_HOST}`,
        'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
        `Content-Length: ${body.length}`,
        'Accept: application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding: gzip, deflate',
        'Accept-Language: en-US,en;q=0.9',
        'Origin: http://192.168.1.1',
        'Referer: http://192.168.1.1/index.html',
        'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
        'X-Requested-With: XMLHttpRequest',
        'Connection: close',
        '',
        body
      ].join('\r\n');
      
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      clearTimeout(timeout);
      
      console.log('[Login] Full response:', responseData.substring(0, 500));
      
      // Extract Set-Cookie header (try both \r\n and \n)
      const cookieMatch = responseData.match(/Set-Cookie:\s*([^\r\n]+)/i);
      if (cookieMatch) {
        const cookie = cookieMatch[1].split(';')[0]; // Get just the cookie value
        console.log('[Login] Session cookie obtained:', cookie);
        socket.destroy();
        resolve(cookie);
      } else {
        console.log('[Login] No cookie in response');
        console.log('[Login] Response headers:', responseData.split('\n\n')[0]);
        socket.destroy();
        resolve(null);
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      console.error('[Login] Error:', error);
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * Fetch station_list using proper HTTP module
 */
function fetchStationListHttp(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: ROUTER_HOST,
      port: ROUTER_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Fetch data from router using raw TCP socket to bypass HTTP parsing
 */
function fetchFromRouter(path: string, cookie?: string | null): Promise<any> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let responseData = '';
    let timeout: NodeJS.Timeout;

    console.log(`[API] Connecting to ${ROUTER_HOST}:${ROUTER_PORT}${path}`);

    // Set timeout
    timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.connect(ROUTER_PORT, ROUTER_HOST, () => {
      console.log('[API] Socket connected, sending HTTP request');
      
      // Send raw HTTP request with browser User-Agent and session cookie
      const headers = [
        `GET ${path} HTTP/1.1`,
        `Host: ${ROUTER_HOST}`,
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding: gzip, deflate',
        'Accept-Language: en-US,en;q=0.9',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Referer: http://192.168.1.1/',
        'Upgrade-Insecure-Requests: 1',
        'User-Agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      ];
      
      // Add cookie if provided
      if (cookie) {
        headers.push(`Cookie: ${cookie}`);
        console.log('[API] Using session cookie');
      }
      
      headers.push('Connection: close', '', '');
      
      const request = headers.join('\r\n');
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      clearTimeout(timeout);
      console.log('[API] Socket closed, processing response');
      console.log('[API] Full response length:', responseData.length);
      console.log('[API] Full response (first 500 chars):', responseData.substring(0, 500));
      
      try {
        // Split headers and body (look for double newline)
        const parts = responseData.split(/\r?\n\r?\n/);
        const body = parts.length > 1 ? parts[parts.length - 1] : responseData;
        
        console.log('[API] Response body:', body);
        console.log('[API] Body length:', body.length);
        
        // Try to parse as JSON
        try {
          const jsonData = JSON.parse(body);
          console.log('[API] Parsed JSON:', JSON.stringify(jsonData, null, 2));
          resolve(jsonData);
        } catch (parseError) {
          console.log('[API] Direct parse failed, trying to extract JSON');
          // Extract JSON from response
          const jsonMatch = body.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extracted = JSON.parse(jsonMatch[0]);
            console.log('[API] Extracted JSON:', JSON.stringify(extracted, null, 2));
            resolve(extracted);
          } else {
            reject(new Error(`No JSON found in response: ${body}`));
          }
        }
      } catch (error) {
        reject(error);
      }
    });

    socket.on('error', (error) => {
      clearTimeout(timeout);
      console.error('[API] Socket error:', error);
      reject(error);
    });

    socket.on('timeout', () => {
      clearTimeout(timeout);
      socket.destroy();
      reject(new Error('Socket timeout'));
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    // Login if we don't have a session cookie
    if (!sessionCookie) {
      console.log('[API] No session cookie, logging in...');
      sessionCookie = await loginToRouter();
      
      if (!sessionCookie) {
        console.log('[API] Login failed, trying without cookie');
      }
    }

    // Fetch device data, station list, hostname list, and system status
    const timestamp = Date.now();
    const stationListPathWithTimestamp = `${STATION_LIST_PATH}&_=${timestamp}`;
    const hostnameListPathWithTimestamp = `${HOSTNAME_LIST_PATH}&_=${timestamp}`;
    
    // Use socket for all endpoints
    const [deviceData, stationListData, hostnameListData, systemStatus] = await Promise.all([
      fetchFromRouter(STA_INFO_PATH, sessionCookie),
      fetchFromRouter(stationListPathWithTimestamp, sessionCookie),
      fetchFromRouter(hostnameListPathWithTimestamp, sessionCookie),
      fetchFromRouter(SYSTEM_STATUS_PATH, sessionCookie),
    ]);

    console.log('[API] station_list response:', JSON.stringify(stationListData, null, 2));
    console.log('[API] station_list array:', stationListData.station_list);
    console.log('[API] hostNameList response:', JSON.stringify(hostnameListData, null, 2));
    console.log('[API] system_status response:', JSON.stringify(systemStatus, null, 2));

    // If we get empty data, try logging in again (session might have expired)
    const isEmpty = Object.values(deviceData).every((v: any) => v === '' || v === 'none');
    if (isEmpty && sessionCookie) {
      console.log('[API] Got empty data, session might be expired. Re-logging in...');
      sessionCookie = await loginToRouter();
      
      if (sessionCookie) {
        const [retryDeviceData, retryStationData, retrySystemStatus] = await Promise.all([
          fetchFromRouter(STA_INFO_PATH, sessionCookie),
          fetchFromRouter(STATION_LIST_PATH, sessionCookie),
          fetchFromRouter(SYSTEM_STATUS_PATH, sessionCookie),
        ]);
        
        return NextResponse.json({
          ...retryDeviceData,
          station_list: retryStationData.station_list || [],
          system_status: retrySystemStatus || {},
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
      }
    }

    // Merge the data
    return NextResponse.json({
      ...deviceData,
      station_list: stationListData.station_list || [],
      hostname_list: hostnameListData,
      system_status: systemStatus,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API] Router API error:', error);
    
    // Clear session cookie on error
    sessionCookie = null;
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to router',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure you are connected to the Prolink hotspot WiFi and can access http://192.168.1.1'
      },
      { status: 500 }
    );
  }
}
