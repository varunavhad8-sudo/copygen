const http = require('http');

const ping = () => {
  http.get('http://127.0.0.1:4000/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Health Check Success:', data);
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('Health Check Failed:', err.message);
    process.exit(1);
  });
};

ping();
