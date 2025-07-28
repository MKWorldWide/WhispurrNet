/**
 * 🧪 WhispurrNet Test Example
 * 
 * This example demonstrates the complete WhispurrNet P2P communication system
 * with all features including whisper messages, broadcasting, resonance,
 * and modular extensions.
 * 
 * Features Demonstrated:
 * - Basic node initialization and connection
 * - Whisper messages (direct encrypted communication)
 * - Broadcast messages (gossip-style propagation)
 * - Resonance messages (intent-based discovery)
 * - Extension system for custom functionality
 * - Network statistics and monitoring
 * - Graceful shutdown and cleanup
 * 
 * Usage:
 * - Run with Deno: deno run --allow-net --allow-crypto examples/whispurr-test.ts
 * - Run with Node.js: node examples/whispurr-test.js (after compilation)
 * 
 * Security: All communication is end-to-end encrypted with ephemeral identities
 */

import { Whispurr, WhispurrExtension, MessageType } from "./Whispurr.ts";
import { Message, createMessage } from "./Protocol.ts";
import { PeerInfo } from "./Node.ts";

/**
 * Example extension for file synchronization
 * Demonstrates the modular extension system
 */
class FileSyncExtension implements WhispurrExtension {
  id = 'file-sync';
  version = '1.0.0';
  supportedTypes = [MessageType.FILE_SYNC];

  async initialize(whispurr: Whispurr): Promise<void> {
    console.log('📁 FileSync extension initialized');
  }

  async handleMessage(message: Message, peer: PeerInfo): Promise<void> {
    const fileMsg = message as any;
    console.log(`📁 File sync from ${peer.nodeId}:`, {
      fileId: fileMsg.fileId,
      chunk: `${fileMsg.chunkIndex + 1}/${fileMsg.totalChunks}`,
      metadata: fileMsg.metadata
    });
  }

  async cleanup(): Promise<void> {
    console.log('📁 FileSync extension cleaned up');
  }
}

/**
 * Example extension for mining signal coordination
 * Demonstrates custom message handling
 */
class MiningSignalExtension implements WhispurrExtension {
  id = 'mining-signal';
  version = '1.0.0';
  supportedTypes = [MessageType.MINING_SIGNAL];

  async initialize(whispurr: Whispurr): Promise<void> {
    console.log('⛏️ MiningSignal extension initialized');
  }

  async handleMessage(message: Message, peer: PeerInfo): Promise<void> {
    const signalMsg = message as any;
    console.log(`⛏️ Mining signal from ${peer.nodeId}:`, {
      type: signalMsg.signalType,
      data: signalMsg.signalData
    });
  }

  async cleanup(): Promise<void> {
    console.log('⛏️ MiningSignal extension cleaned up');
  }
}

/**
 * Example extension for dreamspace burst handling
 * Demonstrates advanced message processing
 */
class DreamspaceExtension implements WhispurrExtension {
  id = 'dreamspace';
  version = '1.0.0';
  supportedTypes = [MessageType.DREAMSPACE];

  async initialize(whispurr: Whispurr): Promise<void> {
    console.log('🌌 Dreamspace extension initialized');
  }

  async handleMessage(message: Message, peer: PeerInfo): Promise<void> {
    const burstMsg = message as any;
    console.log(`🌌 Dreamspace burst from ${peer.nodeId}:`, {
      burstId: burstMsg.burstId,
      data: burstMsg.burstData
    });
  }

  async cleanup(): Promise<void> {
    console.log('🌌 Dreamspace extension cleaned up');
  }
}

/**
 * Main test function demonstrating WhispurrNet capabilities
 */
async function runWhispurrTest(): Promise<void> {
  console.log('🌟 Starting WhispurrNet Test Example\n');

  // Create WhispurrNet instance with debug enabled
  const whispurr = new Whispurr({
    debug: true,
    connection: {
      timeout: 15000,
      maxRetries: 2,
      heartbeatInterval: 20000,
      relayServers: [
        'wss://relay1.whispurrnet.example.com',
        'wss://relay2.whispurrnet.example.com'
      ]
    },
    gossip: {
      maxHops: 5,
      gossipInterval: 3000,
      messageTTL: 120000,
      enableAutoPropagation: true,
      maxConcurrentGossip: 3
    },
    obfuscation: {
      enabled: true,
      patterns: {
        browserRequests: true,
        randomDelays: true,
        packetSizeModification: true,
        fakeHeaders: true
      },
      intensity: 0.6
    }
  });

  try {
    // Initialize the network
    console.log('🔄 Initializing WhispurrNet...');
    await whispurr.initialize();
    console.log(`✅ Node ID: ${whispurr.getNodeId()}`);
    console.log(`🔑 Public Key: ${Array.from(whispurr.getPublicKey()).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('')}...`);

    // Register extensions
    console.log('\n📦 Registering extensions...');
    whispurr.registerExtension(new FileSyncExtension());
    whispurr.registerExtension(new MiningSignalExtension());
    whispurr.registerExtension(new DreamspaceExtension());

    // Simulate peer connections (in real usage, you'd connect to actual peers)
    console.log('\n🔗 Simulating peer connections...');
    await simulatePeerConnections(whispurr);

    // Demonstrate whisper messages (direct encrypted communication)
    console.log('\n💬 Testing whisper messages...');
    await testWhisperMessages(whispurr);

    // Demonstrate broadcast messages (gossip propagation)
    console.log('\n📢 Testing broadcast messages...');
    await testBroadcastMessages(whispurr);

    // Demonstrate resonance messages (intent-based discovery)
    console.log('\n🎯 Testing resonance messages...');
    await testResonanceMessages(whispurr);

    // Demonstrate extension messages
    console.log('\n🔌 Testing extension messages...');
    await testExtensionMessages(whispurr);

    // Show network statistics
    console.log('\n📊 Network Statistics:');
    const stats = whispurr.getStats();
    console.log(JSON.stringify(stats, null, 2));

    // Show connected peers
    console.log('\n👥 Connected Peers:');
    const peers = whispurr.getPeers();
    peers.forEach(peer => {
      console.log(`  - ${peer.nodeId} (${peer.state}, ${peer.type})`);
    });

    // Keep the network running for a while to observe gossip propagation
    console.log('\n⏰ Keeping network alive for 30 seconds to observe gossip...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Graceful shutdown
    console.log('\n🔄 Shutting down WhispurrNet...');
    await whispurr.shutdown();
    console.log('✅ Test completed successfully');
  }
}

/**
 * Simulate peer connections for testing
 * In a real scenario, you'd connect to actual peers
 */
async function simulatePeerConnections(whispurr: Whispurr): Promise<void> {
  // Generate some fake peer information for demonstration
  const fakePeers = [
    {
      id: 'a1b2c3d4e5f67890:1234567890abcdef',
      publicKey: new Uint8Array(32).fill(1)
    },
    {
      id: 'b2c3d4e5f678901a:234567890abcdef1',
      publicKey: new Uint8Array(32).fill(2)
    },
    {
      id: 'c3d4e5f678901ab2:34567890abcdef12',
      publicKey: new Uint8Array(32).fill(3)
    }
  ];

  for (const peer of fakePeers) {
    try {
      const success = await whispurr.connect(peer.id, peer.publicKey);
      if (success) {
        console.log(`  ✅ Connected to ${peer.id}`);
      } else {
        console.log(`  ❌ Failed to connect to ${peer.id}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Connection error for ${peer.id}: ${error.message}`);
    }
  }
}

/**
 * Test whisper messages (direct encrypted communication)
 */
async function testWhisperMessages(whispurr: Whispurr): Promise<void> {
  const peers = whispurr.getPeers();
  if (peers.length === 0) {
    console.log('  ⚠️ No peers connected, skipping whisper test');
    return;
  }

  const targetPeer = peers[0];
  const message = "Hello from WhispurrNet! This is a direct encrypted message.";
  
  console.log(`  📤 Sending whisper to ${targetPeer.nodeId}...`);
  const success = await whispurr.whisper(targetPeer.nodeId, message, 'greeting');
  
  if (success) {
    console.log('  ✅ Whisper sent successfully');
  } else {
    console.log('  ❌ Failed to send whisper');
  }
}

/**
 * Test broadcast messages (gossip propagation)
 */
async function testBroadcastMessages(whispurr: Whispurr): Promise<void> {
  const message = "This is a broadcast message that will propagate through the network via gossip protocol!";
  
  console.log('  📤 Broadcasting message...');
  const successCount = await whispurr.broadcast(message, 'announcement', 5);
  
  console.log(`  ✅ Broadcast sent to ${successCount} immediate peers (will propagate via gossip)`);
}

/**
 * Test resonance messages (intent-based discovery)
 */
async function testResonanceMessages(whispurr: Whispurr): Promise<void> {
  const intents = [
    'whisper:general',
    'file:sync',
    'mining:coordination',
    'dreamspace:burst'
  ];

  for (const intent of intents) {
    console.log(`  🎯 Sending resonance for intent: ${intent}`);
    const successCount = await whispurr.resonate(intent, 0.8);
    console.log(`  ✅ Resonance sent to ${successCount} peers`);
    
    // Small delay between resonances
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * Test extension messages
 */
async function testExtensionMessages(whispurr: Whispurr): Promise<void> {
  const peers = whispurr.getPeers();
  if (peers.length === 0) {
    console.log('  ⚠️ No peers connected, skipping extension test');
    return;
  }

  const targetPeer = peers[0];

  // Test file sync message
  console.log('  📁 Testing file sync message...');
  const fileSyncMessage = await createMessage(
    MessageType.FILE_SYNC,
    whispurr.getNodeId(),
    'file-content-chunk-data',
    {
      fileId: 'test-file-123',
      chunkIndex: 0,
      totalChunks: 3,
      metadata: {
        filename: 'test.txt',
        size: 1024,
        checksum: 'abc123def456'
      }
    }
  );
  await whispurr.sendMessageToPeer(targetPeer.nodeId, fileSyncMessage);

  // Test mining signal message
  console.log('  ⛏️ Testing mining signal message...');
  const miningMessage = await createMessage(
    MessageType.MINING_SIGNAL,
    whispurr.getNodeId(),
    '',
    {
      signalType: 'block_found',
      signalData: {
        blockHash: '0000000000000000000000000000000000000000000000000000000000000000',
        difficulty: 123456,
        timestamp: Date.now()
      }
    }
  );
  await whispurr.sendMessageToPeer(targetPeer.nodeId, miningMessage);

  // Test dreamspace burst message
  console.log('  🌌 Testing dreamspace burst message...');
  const dreamspaceMessage = await createMessage(
    MessageType.DREAMSPACE,
    whispurr.getNodeId(),
    '',
    {
      burstId: 'dream-burst-456',
      burstData: {
        dimension: 'quantum',
        intensity: 0.95,
        coordinates: [42.123, -73.456, 10.789],
        timestamp: Date.now()
      }
    }
  );
  await whispurr.sendMessageToPeer(targetPeer.nodeId, dreamspaceMessage);
}

/**
 * Run the test if this file is executed directly
 */
// Note: import.meta.main is Deno-specific, not available in Node.js
// For Node.js compatibility, we'll export the function instead
export { runWhispurrTest, FileSyncExtension, MiningSignalExtension, DreamspaceExtension };

 