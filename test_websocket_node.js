const WebSocket = require('ws');

// Test the WebSocket connection
const ws = new WebSocket('ws://127.0.0.1:8000/ws/test/');

ws.on('open', function open() {
    console.log('Connected to WebSocket server');
    ws.send(JSON.stringify({type: 'test', message: 'Hello from Node.js'}));
});

ws.on('message', function message(data) {
    console.log('Received:', data.toString());
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('WebSocket connection closed');
});