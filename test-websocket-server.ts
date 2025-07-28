// Simple WebSocket test script for the WhispurrNet bootstrap node
// Run with: deno run --allow-net test-websocket-server.ts

const WS_SERVER_URL = 'ws://localhost:9000';

async function testWebSocketServer() {
  console.log('🚀 Testing WebSocket server at:', WS_SERVER_URL);
  
  // Generate a random peer ID for testing
  const peerId = `test-peer-${Math.random().toString(36).substr(2, 8)}`;
  console.log('🔑 Test peer ID:', peerId);
  
  try {
    // Create WebSocket connection
    const ws = new WebSocket(WS_SERVER_URL);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      
      // Send HELLO message
      const helloMsg = {
        type: 'hello',
        senderId: peerId,
        timestamp: new Date().toISOString(),
        payload: {
          nodeInfo: {
            id: peerId,
            version: '1.0.0',
            capabilities: ['whisper']
          },
          addresses: [`ws://localhost:${Math.floor(9000 + Math.random() * 1000)}`]
        }
      };
      
      console.log('📤 Sending HELLO message:', JSON.stringify(helloMsg, null, 2));
      ws.send(JSON.stringify(helloMsg));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('\n📨 Received message:', JSON.stringify(message, null, 2));
        
        // Handle different message types
        if (message.type === 'welcome') {
          console.log('🎉 Received WELCOME message from server');
          
          // Send a test message
          const testMsg = {
            type: 'message',
            senderId: peerId,
            timestamp: new Date().toISOString(),
            payload: {
              text: 'Hello from test peer!',
              counter: 1
            }
          };
          
          console.log('📤 Sending test message:', JSON.stringify(testMsg, null, 2));
          ws.send(JSON.stringify(testMsg));
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`🔌 Connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
      console.log('   • Clean:', event.wasClean ? 'Yes' : 'No');
      
      if (event.code !== 1000) {
        console.log('⚠️ Unexpected disconnect, attempting to reconnect in 2 seconds...');
        setTimeout(testWebSocketServer, 2000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    // Set up keepalive pings
    const keepalive = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingMsg = {
          type: 'ping',
          senderId: peerId,
          timestamp: Date.now(),
          messageId: `ping-${Date.now()}`
        };
        ws.send(JSON.stringify(pingMsg));
      }
    }, 15000);
    
    // Clean up on exit
    const handleExit = () => {
      console.log('\n🛑 Shutting down test client...');
      clearInterval(keepalive);
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Test completed');
      }
      
      Deno.exit(0);
    };
    
    // Handle process termination
    Deno.addSignalListener('SIGINT', handleExit);
    Deno.addSignalListener('SIGTERM', handleExit);
    
  } catch (error) {
    console.error('❌ Error in WebSocket test:', error);
    
    // Retry after a delay
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(testWebSocketServer, 5000);
  }
}

// Start the test
console.log('🚀 Starting WebSocket test client...');
testWebSocketServer();
