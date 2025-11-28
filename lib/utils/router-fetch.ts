/**
 * Utility for fetching data from router
 * In production (Vercel), connects directly to router from browser
 * In development, uses API routes to avoid CORS
 */

const IS_BROWSER = typeof window !== 'undefined';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ROUTER_IP = '192.168.1.1';

/**
 * Fetch data from router
 * @param endpoint - The router endpoint path (e.g., '/reqproc/proc_get')
 * @param params - Query parameters
 */
export async function fetchFromRouter(
  endpoint: string,
  params?: Record<string, string>
): Promise<any> {
  // In production, connect directly to router from browser
  if (IS_PRODUCTION && IS_BROWSER) {
    const queryParams = new URLSearchParams({
      ...params,
      _: Date.now().toString(), // Cache buster
    });
    
    const url = `http://${ROUTER_IP}${endpoint}?${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Router request failed: ${response.status}`);
    }

    return await response.json();
  }
  
  // In development, use API route
  console.log('[router-fetch] Using API route in development mode');
  
  const response = await fetch('/api/router', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('[router-fetch] API route response:', data);
  return data;
}

/**
 * Post data to router
 */
export async function postToRouter(
  endpoint: string,
  body: Record<string, string>
): Promise<any> {
  // In production, connect directly to router from browser
  if (IS_PRODUCTION && IS_BROWSER) {
    const formBody = new URLSearchParams(body).toString();
    const url = `http://${ROUTER_IP}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
      cache: 'no-store',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Router request failed: ${response.status}`);
    }

    return await response.json().catch(() => ({ success: true }));
  }
  
  // In development, use API route
  const apiEndpoint = endpoint.replace('/reqproc/proc_post', '/api/reboot');
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return await response.json();
}
