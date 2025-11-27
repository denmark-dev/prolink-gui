// Test router login to get session cookie
const net = require('net');

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;

// Router credentials
const credentials = [
  { username: 'admin', password: 'password' },
];

function testLogin(username, password) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responseData = '';

    socket.setTimeout(3000);

    socket.connect(ROUTER_PORT, ROUTER_HOST, () => {
      // Try different login endpoints
      const loginPaths = [
        `/reqproc/proc_get?isTest=false&cmd=login&user=${username}&password=${password}`,
        `/goform/goform_set_cmd_process?goformId=LOGIN&username=${username}&password=${password}`,
      ];

      const path = loginPaths[0];
      
      const request = [
        `GET ${path} HTTP/1.1`,
        `Host: ${ROUTER_HOST}`,
        'Accept: application/json',
        'Connection: close',
        '',
        ''
      ].join('\r\n');
      
      console.log(`\nTrying: ${username} / ${password}`);
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      console.log('Response (first 500 chars):');
      console.log(responseData.substring(0, 500));
      
      // Look for Set-Cookie header
      const cookieMatch = responseData.match(/Set-Cookie: ([^\r\n]+)/i);
      if (cookieMatch) {
        console.log('\n✓ Cookie found:', cookieMatch[1]);
      }
      
      socket.destroy();
      resolve();
    });

    socket.on('error', (error) => {
      console.log(`ERROR: ${error.message}`);
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      console.log('TIMEOUT');
      socket.destroy();
      resolve();
    });
  });
}

async function testAll() {
  console.log('Testing router login...\n');
  console.log('NOTE: Replace with your actual admin credentials if different\n');
  
  for (const cred of credentials) {
    await testLogin(cred.username, cred.password);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\nDone! If you see a cookie, we can use it for authentication.');
  console.log('Otherwise, please provide your router admin username and password.');
}

testAll();
