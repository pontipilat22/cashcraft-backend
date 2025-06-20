const http = require('http');

// Тестовый запрос к API курсов валют
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/exchange-rates/rate?from=USD&to=EUR',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed Response:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.success && parsed.data && parsed.data.rate) {
        console.log(`\n✅ SUCCESS: 1 USD = ${parsed.data.rate} EUR`);
      } else {
        console.log('\n❌ ERROR: Invalid response structure');
      }
    } catch (e) {
      console.log('\n❌ ERROR: Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ ERROR: ${e.message}`);
});

req.end(); 