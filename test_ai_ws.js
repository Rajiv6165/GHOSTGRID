const WebSocket = require('ws');

const boardId = 'b5a656c9-e28e-4781-a167-48ad9e796c05';
const url = `ws://localhost:8000/ws/board/${boardId}/`;

console.log(`Connecting to WebSocket for AI test: ${url}`);
const ws = new WebSocket(url);

let timeout = setTimeout(() => {
  console.error('Test timed out after 10 seconds');
  ws.terminate();
  process.exit(1);
}, 10000);

ws.on('open', () => {
  console.log('WebSocket connected successfully!');
  // Send the join room message first
  ws.send(JSON.stringify({
    action: 'join',
    board_id: boardId
  }));
  
  // Wait 1 second before sending the AI generate command to let connection settle
  setTimeout(() => {
    const payload = {
      type: 'ai_generate',
      prompt: 'design a netflix clone'
    };
    console.log('Sending AI Generate request:', JSON.stringify(payload));
    ws.send(JSON.stringify(payload));
  }, 1000);
});

ws.on('message', (data) => {
  const message = data.toString();
  console.log('Received message from server:', message);
  
  try {
    const parsed = JSON.parse(message);
    if (parsed.type === 'ai_generated') {
      console.log('SUCCESS: Received ai_generated event!');
      console.log('Nodes count:', parsed.nodes?.length || 0);
      console.log('Edges count:', parsed.edges?.length || 0);
      console.log('Nodes details:', JSON.stringify(parsed.nodes, null, 2));
      clearTimeout(timeout);
      ws.close();
      process.exit(0);
    } else if (parsed.type === 'ai_error') {
      console.error('AI Error received from backend:', parsed.error);
      clearTimeout(timeout);
      ws.close();
      process.exit(1);
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
