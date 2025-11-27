// Test different router endpoints to find connected devices
const net = require('net');

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;

// Different possible endpoints/commands to try
const endpoints = [
  '/reqproc/proc_get?isTest=false&cmd=sta_info&multi_data=1',
  '/reqproc/proc_get?isTest=false&cmd=sta_list&multi_data=1',
  '/reqproc/proc_get?isTest=false&cmd=station_list&multi_data=1',
  '/reqproc/proc_get?cmd=sta_info',
  '/reqproc/proc_get?cmd=station_info',
  '/goform/goform_get_cmd_process?cmd=station_list',
  '/goform/goform_get_cmd_process?cmd=sta_list',
  '/cgi-bin/qcmap_web_cgi?cmd=getConnectedDevices',
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let responseData = '';

    socket.setTimeout(3000);

    socket.connect(ROUTER_PORT, ROUTER_HOST, () => {
      const request = [
        `GET ${path} HTTP/1.1`,
        `Host: ${ROUTER_HOST}`,
        'Accept: application/json, text/html',
        'Connection: close',
        '',
        ''
      ].join('\r\n');
      
      socket.write(request);
    });

    socket.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    socket.on('end', () => {
      // Extract body
      const parts = responseData.split(/\r?\n\r?\n/);
      const body = parts.length > 1 ? parts[parts.length - 1] : responseData;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Endpoint: ${path}`);
      console.log(`${'='.repeat(80)}`);
      console.log('Response body:', body.substring(0, 500));
      
      socket.destroy();
      resolve();
    });

    socket.on('error', (error) => {
      console.log(`\nEndpoint: ${path} - ERROR: ${error.message}`);
      socket.destroy();
      resolve();
    });

    socket.on('timeout', () => {
      console.log(`\nEndpoint: ${path} - TIMEOUT`);
      socket.destroy();
      resolve();
    });
  });
}

async function testAll() {
  console.log('Testing different router endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait between requests
  }
  
  console.log('\n\nDone! Check the responses above to see which endpoint returns device data.');
}

testAll();
