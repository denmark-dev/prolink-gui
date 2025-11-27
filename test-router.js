// Quick test script to verify router connectivity
const axios = require('axios');

const ROUTER_URL = 'http://192.168.1.1/reqproc/proc_get';
const API_PARAMS = 'isTest=false&cmd=sta_info1,sta_info2,sta_info3,sta_info4,sta_info5,sta_info6&multi_data=1';

console.log('Testing router connection...');
console.log(`URL: ${ROUTER_URL}?${API_PARAMS}\n`);

axios.get(`${ROUTER_URL}?${API_PARAMS}`, {
  timeout: 5000,
  validateStatus: () => true,
})
  .then(response => {
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.log('❌ FAILED!');
    if (axios.isAxiosError(error)) {
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    } else {
      console.log('Error:', error);
    }
  });
