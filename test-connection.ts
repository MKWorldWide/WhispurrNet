/**
 * 🔌 Test Connection to Bootstrap Node
 * 
 * This script tests the connection to the WhispurrNet bootstrap node.
 */

// Import Deno standard library modules
import { WebSocket } from 'https://deno.land/std@0.152.0/ws/mod.ts';

// Import WhispurrNet core
import { PeerManager, PeerInfo } from './src/peer/PeerManager.ts';
import { PEER_MESSAGE_TYPES } from './src/peer/PeerAddressing.ts';
import { BOOTSTRAP_NODES } from './divina-l3-config.ts';

// Test connection to the bootstrap node
async function testConnection() {
  console.log('🚀 Testing connection to bootstrap node...');
  
  // Create a unique node ID for this test
  const nodeId = `test-node-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔑 Test node ID: ${nodeId}`);
  
  // Initialize peer manager
  const peerManager = new PeerManager({
    nodeId,
    maxPeers: 10,
    connectionTimeout: 30000,
    pingInterval: 10000
  });
  
  // Set up event listeners
  peerManager.on('peer:connected', (peer) => {
    console.log(`✅ Connected to peer: ${peer.nodeId}`);
    
    // Send a test message after connection
    const testMessage = {
      type: PEER_MESSAGE_TYPES.MESSAGE,
      senderId: nodeId,
      timestamp: new Date().toISOString(),
      payload: {
        message: 'Hello from test node!',
        timestamp: Date.now()
      }
    };
    
    console.log('📤 Sending test message to bootstrap node:', testMessage);
    peerManager.sendMessage(peer.nodeId, testMessage)
      .then(() => console.log('✅ Test message sent successfully'))
      .catch(err => console.error('❌ Failed to send test message:', err));
  });
  
  peerManager.on('message', ({ peer, message }) => {
    console.log(`📨 Received message from ${peer.nodeId}:`, message);
    
    // Handle different message types
    switch (message.type) {
      case PEER_MESSAGE_TYPES.WELCOME:
        console.log('🎉 Successfully connected to bootstrap node!');
        console.log('   • Your node ID:', message.payload?.yourId || 'unknown');
        console.log('   • Connection ID:', message.payload?.connectionId || 'unknown');
        break;
        
      case PEER_MESSAGE_TYPES.MESSAGE:
        console.log('💬 Message content:', message.payload);
        break;
        
      case PEER_MESSAGE_TYPES.PING:
      case PEER_MESSAGE_TYPES.PONG:
        // Handled automatically by PeerManager
        break;
        
      default:
        console.log('ℹ️  Unknown message type:', message.type);
    }
  });
  
  peerManager.on('peer:error', (peer, error) => {
    console.error(`❌ Peer error (${peer.nodeId}):`, error);
  });
  
  // Start the peer manager
  peerManager.start();
  
  try {
    // Get bootstrap node info
    const bootstrapNode = BOOTSTRAP_NODES[0];
    if (!bootstrapNode) {
      throw new Error('No bootstrap nodes configured');
    }
    
    console.log(`🔗 Connecting to bootstrap node at: ${bootstrapNode.addresses[0]}`);
    
    // Create a WebSocket connection to the bootstrap node
    const ws = new WebSocket(bootstrapNode.addresses[0]);
    
    // Set up WebSocket event handlers
    ws.onopen = () => {
      console.log('🔌 WebSocket connection established, sending HELLO...');
      
      // Send HELLO message with our node info
      const helloMessage = {
        type: PEER_MESSAGE_TYPES.HELLO,
        senderId: nodeId,
        timestamp: new Date().toISOString(),
        payload: {
          nodeInfo: {
            id: nodeId,
            version: '1.0.0',
            capabilities: ['whisper']
          },
          addresses: [`ws://localhost:${(globalThis as any).location?.port || 'unknown'}`]
        }
      };
      
      ws.send(JSON.stringify(helloMessage));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data.toString());
        
        // Forward messages to the peer manager
        if (message.senderId === 'bootstrap-node') {
          peerManager.handleIncomingMessage('bootstrap-node', event.data.toString());
        }
      } catch (error) {
        console.error('❌ Error handling message:', error);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`🔌 WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
      console.log('   • Clean:', event.wasClean ? 'Yes' : 'No');
      
      // Try to reconnect after a delay
      if (this.isRunning) {
        console.log('🔄 Attempting to reconnect in 5 seconds...');
        setTimeout(() => testConnection(), 5000);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    // Keep the process running
    console.log('\n🔄 Connection test in progress... (Press Ctrl+C to exit)');
    await new Promise((resolve) => {
      // Handle process termination
      const handleExit = async () => {
        console.log('\n🛑 Shutting down test node...');
        ws.close(1000, 'Test completed');
        await peerManager.stop();
        Deno.exit(0);
      };
      
      Deno.addSignalListener('SIGINT', handleExit);
      Deno.addSignalListener('SIGTERM', handleExit);
    });
    
  } catch (error) {
    console.error('❌ Error during connection test:', error);
    await peerManager.stop();
    Deno.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);
