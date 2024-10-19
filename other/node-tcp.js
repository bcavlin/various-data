const net = require('net');

// Configuration
const logstashHost = '127.0.0.1';  // Logstash server IP or hostname
const logstashPort = 5000;         // Port configured in Logstash

// Create a TCP client
const client = new net.Socket();

// Connect to Logstash
client.connect(logstashPort, logstashHost, () => {
  console.log('Connected to Logstash');
});

// Handle connection errors
client.on('error', (err) => {
  console.error('Error connecting to Logstash:', err);
});

// Example JSON log
const logEntry = {
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'This is a test log from Node.js',
  service: 'my-nodejs-app'
};

// Send the log as a JSON string with a newline
client.write(JSON.stringify(logEntry) + '\n');

// Close the connection (optional, if only sending once)
setTimeout(() => {
  client.end();
  console.log('Connection closed');
}, 1000);
