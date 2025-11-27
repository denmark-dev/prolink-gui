// Check basic router info and try to find device listing
const net = require('net');

const ROUTER_HOST = '192.168.1.1';
const ROUTER_PORT = 80;

// Try to get general router status which might include device count
const infoEndpoints = [
  '/reqproc/proc_get?isTest=false&cmd=wan_apn,ipv4_ip_addr,ipv4_gateway,ipv4_pridns,ipv4_snddns,wan_csq,network_type,network_provider,sta_count&multi_data=1',
  '/reqproc/proc_get?cmd=wan_status,sta_count,network_type',
  '/reqproc/proc_get?cmd=status',
  '/status.json',
  '/api/device/information',
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
        'Accept: application/json',
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
      const parts = responseData.split(/\r?\n\r?\n/);
      const body = parts.length > 1 ? parts[parts.length - 1] : responseData;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Endpoint: ${path}`);
      console.log(`${'='.repeat(80)}`);
      console.log(body.substring(0, 800));
      
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
  console.log('Checking router information endpoints...\n');
  
  for (const endpoint of infoEndpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n\nDone!');
}

testAll();
