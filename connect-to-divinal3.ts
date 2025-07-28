/**
 * 🔌 Connect to Divina-L3 Network
 * 
 * This script demonstrates how to connect to the Divina-L3 network
 * using the WhispurrNet protocol.
 * 
 * To run:
 * deno run --allow-net --allow-crypto connect-to-divinal3.ts
 */

import { Whispurr } from './whispurrnet/Whispurr';
import { BOOTSTRAP_NODES, NETWORK_CONFIG } from './divina-l3-config';
import { Message, MessageType } from './whispurrnet/Protocol';

// Function to format peer information for display
function formatPeerInfo(peer: any): string {
  return `Peer ${peer.nodeId} (${peer.state}, ${peer.type})`;
}

async function connectToDivinaL3() {
  console.log('🚀 Connecting to Divina-L3 network...');
  console.log(`📡 Network: ${NETWORK_CONFIG.networkId}`);
  console.log(`🔐 Protocol version: ${NETWORK_CONFIG.protocolVersion}\n`);

  try {
    // Initialize Whispurr with Divina-L3 configuration
    const whispurr = new Whispurr({
      ...NETWORK_CONFIG,
      // Add any additional configuration overrides here
    });

    // Set up event handlers
    whispurr.onEvent((event) => {
      switch (event.type) {
        case 'connected':
          console.log(`✅ Connected to ${formatPeerInfo(event.peer)}`);
          break;
        case 'disconnected':
          console.log(`⚠️ Disconnected from peer ${event.peerId}: ${event.reason}`);
          break;
        case 'message':
          const msg = event.message;
          console.log(`\n📨 New ${msg.type} message from ${event.peer.nodeId}:`);
          console.log(`   • Timestamp: ${new Date().toISOString()}`);
          console.log(`   • Type: ${msg.type}`);
          
          // Handle different message types
          if (msg.type === MessageType.WHISPER) {
            console.log('   • Message Type: Private Whisper');
          } else if (msg.type === MessageType.BROADCAST) {
            console.log('   • Message Type: Network Broadcast');
          } else if (msg.type === MessageType.RESONANCE) {
            console.log('   • Message Type: Resonance (Intent-based)');
          }
          
          // Display a preview of the message content
          const preview = msg.payload.length > 100 
            ? `${msg.payload.substring(0, 100)}...` 
            : msg.payload;
          console.log(`   • Content: ${preview}`);
          break;
        case 'error':
          console.error(`❌ Error${event.peerId ? ` with peer ${event.peerId}` : ''}:`, event.error);
          break;
      }
    });

    // Initialize the node
    console.log('🔑 Initializing Whispurr node...');
    await whispurr.initialize();
    console.log(`✅ Node initialized with ID: ${whispurr.getNodeId()}`);

    // Connect to bootstrap nodes
    console.log(`\n🔗 Connecting to ${BOOTSTRAP_NODES.length} bootstrap nodes...`);
    const connectionPromises = BOOTSTRAP_NODES.map(async (node) => {
      try {
        console.log(`   • Attempting connection to ${node.nodeId}...`);
        const connected = await whispurr.connect(node.nodeId, node.publicKey);
        if (connected) {
          console.log(`   ✅ Successfully connected to ${node.nodeId}`);
        } else {
          console.warn(`   ⚠️ Failed to connect to ${node.nodeId}`);
        }
        return connected;
      } catch (error) {
        console.error(`   ❌ Error connecting to ${node.nodeId}:`, error.message);
        return false;
      }
    });

    // Wait for all connection attempts to complete
    console.log('\n⏳ Waiting for connection attempts to complete...');
    const connectionResults = await Promise.all(connectionPromises);
    const successfulConnections = connectionResults.filter(Boolean).length;
    
    // Display network status
    console.log('\n🌍 Network Status:');
    console.log('   •'.padEnd(5) + `Connected to ${successfulConnections}/${BOOTSTRAP_NODES.length} bootstrap nodes`);
    console.log('   •'.padEnd(5) + `Total peers: ${whispurr.getPeers().length}`);
    
    if (successfulConnections > 0) {
      console.log('\n🎉 Successfully connected to the Divina-L3 network!');
      console.log('\n📡 Listening for messages... (Press Ctrl+C to exit)');
    } else {
      console.warn('\n⚠️  Warning: Could not connect to any bootstrap nodes.');
      console.log('   The node is running but may not be able to communicate with the network.');
    }

    // Set up graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down Whispurr node...');
      try {
        await whispurr.shutdown();
        console.log('👋 Disconnected from Divina-L3 network');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle process termination signals
    process.on('SIGINT', shutdown);  // Ctrl+C
    process.on('SIGTERM', shutdown); // kill command

  } catch (error) {
    console.error('❌ Failed to connect to Divina-L3 network:');
    console.error(error);
    process.exit(1);
  }
}

// Run the connection
connectToDivinaL3().catch(console.error);
