const WebSocket = require('ws');

const boardId = 'b5a656c9-e28e-4781-a167-48ad9e796c05';
const url = `ws://localhost:8000/ws/board/${boardId}/`;

console.log(`Connecting to WebSocket: ${url}`);
const ws = new WebSocket(url);

let timeout = setTimeout(() => {
  console.error('Test timed out after 5 seconds');
  ws.terminate();
  process.exit(1);
}, 5000);

ws.on('open', () => {
  console.log('WebSocket connected successfully!');
  // Send the join room message
  const payload = {
    action: 'join',
    board_id: boardId
  };
  console.log('Sending message:', JSON.stringify(payload));
  ws.send(JSON.stringify(payload));
});

ws.on('message', (data) => {
  const message = data.toString();
  console.log('Received message from server:', message);
  
  try {
    const parsed = JSON.parse(message);
    if (parsed.type === 'board_state') {
      console.log('Successfully received board state!');
      console.log(`Board ID: ${parsed.board_id}`);
      console.log(`Nodes count: ${parsed.nodes?.length || 0}`);
      console.log(`Edges count: ${parsed.edges?.length || 0}`);
      clearTimeout(timeout);
      ws.close();
      process.exit(0);
    }
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error occurred:', err);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', () => {
  console.log('WebSocket connection closed.');
});
