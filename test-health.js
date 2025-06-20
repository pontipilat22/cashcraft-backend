const express = require('express');
const app = express();

// Простейший CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  console.log('Health check received from:', req.ip);
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint
app.get('/api/v1/exchange-rates/rate', (req, res) => {
  console.log('Exchange rate request:', req.query);
  res.json({ 
    success: true, 
    data: { 
      rate: 0.85, 
      from: req.query.from, 
      to: req.query.to 
    } 
  });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${PORT}`);
  console.log('Try accessing:');
  console.log(`- http://192.168.2.101:${PORT}/health`);
  console.log(`- http://192.168.2.101:${PORT}/api/v1/exchange-rates/rate?from=USD&to=EUR`);
}); 