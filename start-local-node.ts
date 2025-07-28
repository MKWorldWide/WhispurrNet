/**
 * Local WhispurrNet Node
 * 
 * This script starts a local WhispurrNet node for testing and development.
 * It uses the local testnet configuration and provides a simple CLI interface.
 */

import { Whispurr } from './whispurrnet/Whispurr.ts';
import { LOCAL_NODE_CONFIG, BOOTSTRAP_NODE } from './local-testnet-config.ts';
import { Message, MessageType, createMessage } from "./whispurrnet/Protocol.ts";
// Import Node.js crypto module using the node: protocol
import { randomBytes } from 'node:crypto';

// Create a new Whispurr node with the local testnet configuration
const node = new Whispurr({
  ...LOCAL_NODE_CONFIG,
  // Override any necessary config for direct WebSocket connections
  connection: {
    ...LOCAL_NODE_CONFIG.connection,
    // Ensure WebRTC is disabled
    rtcConfig: undefined,
    // Enable direct WebSocket connections
    enableDirectWebSocket: true,
    // Disable relay fallback
    relayServers: [],
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nShutting down WhispurrNet node...');
  await node.shutdown();
  process.exit(0);
});

// Generate a random string for nonce
function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

// Start the node
async function startNode() {
  try {
    console.log('🚀 Starting local WhispurrNet node...');
    
    // Initialize the node
    await node.initialize();
    
    // Log node information
    const nodeId = node.getNodeId();
    
    console.log(`🔑 Node ID: ${nodeId}`);
    console.log('🌐 Listening on:');
    console.log('  - /ip4/127.0.0.1/tcp/9000/ws');
    console.log('  - /ip4/0.0.0.0/tcp/9000/ws');
    console.log('  - /dns4/localhost/tcp/9000/ws');
    console.log('\nPress Ctrl+C to stop the node\n');
    
    // Set up event handlers using the WhispurrNode event emitter
    const nodeEmitter = (node as any).node; // Access the internal WhispurrNode instance
    
    nodeEmitter.on('connected', (event: any) => {
      console.log(`🔗 Connected to peer: ${event.peer.nodeId}`);
    });
    
    nodeEmitter.on('disconnected', (event: any) => {
      console.log(`❌ Disconnected from peer: ${event.peerId} (${event.reason || 'no reason provided'})`);
    });
    
    // Handle incoming messages
    nodeEmitter.on('message', async (event: any) => {
      const message = event.message;
      console.log(`📨 Received ${message.type} message from ${event.peer.nodeId}`);
      
      // Echo the message back if it's a WHISPER message
      if (message.type === MessageType.WHISPER && message.targetId === nodeId) {
        try {
          // Create a response message
          const response = await createMessage(
            MessageType.WHISPER,
            nodeId,
            `Echo: ${message.payload || 'pong'}`,
            {
              targetId: message.senderId,
              ttl: 30000,
              whisperTag: 'echo',
              intent: 'test'
            }
          );
          
          await node.sendMessageToPeer(message.senderId, response);
          console.log(`🔄 Echoed message back to ${message.senderId}`);
        } catch (error) {
          console.error('❌ Error echoing message:', error);
        }
      }
      // Handle other message types
      else if (message.type === MessageType.BROADCAST) {
        console.log(`📢 Broadcast from ${message.senderId}: ${message.payload}`);
      }
    });
    
    nodeEmitter.on('error', (event: any) => {
      console.error('❌ Error:', event.error);
      if (event.peerId) {
        console.error(`  Peer: ${event.peerId}`);
      }
    });
    
    // Connect to bootstrap node if configured
    if (BOOTSTRAP_NODE.addresses.length > 0) {
      console.log('🔍 Attempting to connect to bootstrap node...');
      
      try {
        // In a real scenario, we would use the bootstrap node's public key
        // For local testing, we'll just use a dummy public key
        const dummyPublicKey = new Uint8Array(32); // 32-byte array for Ed25519
        
        // Get the first bootstrap address
        const bootstrapAddress = BOOTSTRAP_NODE.addresses[0];
        
        console.log(`  Trying to connect to bootstrap node at ${bootstrapAddress}...`);
        
        // Create a direct WebSocket connection
        const ws = new WebSocket(`ws://localhost:9000`);
        
        ws.onopen = async () => {
          console.log('✅ WebSocket connection established to bootstrap node!');
          
          // Send a test message to the bootstrap node
          const testMessage = await createMessage(
            MessageType.WHISPER,
            nodeId,
            'Hello from test node!',
            {
              targetId: BOOTSTRAP_NODE.nodeId,
              ttl: 30000,
              whisperTag: 'test',
              intent: 'greeting'
            }
          );
          
          ws.send(JSON.stringify(testMessage));
          console.log('📤 Sent test message to bootstrap node');
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log(`📨 Received message from bootstrap node:`, message);
          } catch (error) {
            console.error('❌ Error parsing message from bootstrap node:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          console.log(`🔌 WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
        };
        
      } catch (error) {
        console.error('❌ Error connecting to bootstrap node:', error);
      }
    }
    
    console.log('✅ WhispurrNet node is running!');
    
    // Example: Send a test broadcast message every 30 seconds
    setInterval(async () => {
      try {
        const peers = node.getPeers();
        if (peers.length > 0) {
          const broadcastMessage = await createMessage(
            MessageType.BROADCAST,
            nodeId,
            `Hello from ${nodeId.substring(0, 8)} at ${new Date().toISOString()}`,
            {
              ttl: 30000,
              whisperTag: 'test-broadcast',
              intent: 'test',
              maxHops: 5
            }
          );
          
          console.log(`📤 Broadcasting message to ${peers.length} peer(s)...`);
          await node.broadcast(broadcastMessage.payload, 'test');
        } else {
          console.log('ℹ️ No connected peers to broadcast to');
        }
      } catch (error) {
        console.error('❌ Error broadcasting message:', error);
      }
    }, 30000);
    
  } catch (error) {
    console.error('❌ Failed to start WhispurrNet node:', error);
    process.exit(1);
  }
}

// Run the node
startNode();
