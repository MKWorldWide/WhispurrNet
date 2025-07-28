/**
 * 🔌 Connect to Divina-L3 Network
 * 
 * This script demonstrates how to connect to the Divina-L3 network
 * using the WhispurrNet protocol.
 * 
 * To run:
 * deno run --allow-net --allow-crypto connect-to-divinal3.ts
 */

import { Whispurr } from './whispurrnet/Whispurr.ts';
import { BOOTSTRAP_NODES, NETWORK_CONFIG } from './divina-l3-config.ts';
import { Message, MessageType } from './whispurrnet/Protocol.ts';

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

    // Set up event handlers for the Whispurr node
    whispurr['node'].on('connect', (peer: any) => {
      console.log(`✅ Connected to peer ${peer.nodeId}`);
    });

    whispurr['node'].on('disconnect', (peerId: string, reason: string) => {
      console.log(`⚠️ Disconnected from peer ${peerId}: ${reason}`);
    });

    whispurr['node'].on('message', (message: any, peer: any) => {
      console.log(`\n📨 New message from ${peer.nodeId}:`);
      console.log(`   • Timestamp: ${new Date().toISOString()}`);
      console.log(`   • Type: ${message.type}`);
      
      // Handle different message types
      if (message.type === MessageType.WHISPER) {
        console.log('   • Message Type: Private Whisper');
      } else if (message.type === MessageType.BROADCAST) {
        console.log('   • Message Type: Network Broadcast');
      } else if (message.type === MessageType.RESONANCE) {
        console.log('   • Message Type: Resonance (Intent-based)');
      }
      
      // Display a preview of the message content
      const preview = message.payload && message.payload.length > 100 
        ? `${message.payload.substring(0, 100)}...` 
        : message.payload || '[No content]';
      console.log(`   • Content: ${preview}`);
    });

    whispurr['node'].on('error', (error: Error) => {
      console.error('❌ Node error:', error);
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
