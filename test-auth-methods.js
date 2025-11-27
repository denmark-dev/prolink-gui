// Test different authentication methods for Prolink router
const net = require('net');

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;
const USERNAME = 'admin';
const PASSWORD = 'password';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responseData = '';

    socket.setTimeout(5000);

    socket.connect(ROUTER_PORT, ROUTER_HOST, () => {
      const defaultHeaders = {
        'Host': ROUTER_HOST,
        'Accept': 'application/json, text/html',
        'Connection': 'close',
      };

      const allHeaders = { ...defaultHeaders, ...headers };
      
      let request = `${method} ${path} HTTP/1.1\r\n`;
      for (const [key, value] of Object.entries(allHeaders)) {
        request += `${key}: ${value}\r\n`;
      }
      
      if (body) {
        request += `Content-Length: ${body.length}\r\n`;
        request += '\r\n';
        request += body;
      } else {
        request += '\r\n';
      }
      
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      const parts = responseData.split(/\r?\n\r?\n/);
      const headers = parts[0];
      const body = parts.length > 1 ? parts[parts.length - 1] : '';
      
      console.log('\n' + '='.repeat(80));
      console.log(`${method} ${path}`);
      console.log('='.repeat(80));
      
      // Check for cookies
      const cookieMatch = headers.match(/Set-Cookie: ([^\r\n]+)/gi);
      if (cookieMatch) {
        console.log('Cookies:', cookieMatch);
      }
      
      console.log('Body:', body.substring(0, 300));
      
      socket.destroy();
      resolve({ headers, body });
    });

    socket.on('error', (error) => {
      console.log(`\nERROR: ${error.message}`);
      socket.destroy();
      resolve(null);
    });

    socket.on('timeout', () => {
      console.log('\nTIMEOUT');
      socket.destroy();
      resolve(null);
    });
  });
}

async function testAuth() {
  console.log('Testing Prolink router authentication methods...\n');
  
  // Test 1: GET with credentials in URL
  await makeRequest('GET', `/reqproc/proc_get?isTest=false&cmd=login&user=${USERNAME}&password=${PASSWORD}`);
  await new Promise(r => setTimeout(r, 500));
  
  // Test 2: POST login
  const loginBody = `username=${USERNAME}&password=${PASSWORD}`;
  await makeRequest('POST', '/login', loginBody, {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Test 3: Basic Auth header
  const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  await makeRequest('GET', '/reqproc/proc_get?isTest=false&cmd=sta_info1,sta_info2,sta_info3,sta_info4,sta_info5,sta_info6&multi_data=1', null, {
    'Authorization': `Basic ${basicAuth}`
  });
  await new Promise(r => setTimeout(r, 500));
  
  // Test 4: Try to get token first
  await makeRequest('GET', '/reqproc/proc_get?isTest=false&cmd=wa_inner_version');
  await new Promise(r => setTimeout(r, 500));
  
  // Test 5: Check if there's a session endpoint
  await makeRequest('GET', '/session.cgi');
  
  console.log('\n\nDone! Check the responses above.');
}

testAuth();
