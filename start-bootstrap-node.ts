// @deno-types="https://deno.land/x/types/deno.d.ts"
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference types="https://deno.land/x/types/deno.d.ts" />

// Import Deno standard library modules
import { serve } from 'https://deno.land/std@0.152.0/http/server.ts';
import { WebSocket } from 'https://deno.land/std@0.152.0/ws/mod.ts';

// Import WhispurrNet core
import { Whispurr } from './src/Whispurr.ts';
import { MessageType, createMessage, deserializeMessage, serializeMessage } from './src/Protocol.ts';
import { PeerManager, PeerInfo } from './src/peer/PeerManager.ts';
import { PeerAddressing, PEER_MESSAGE_TYPES } from './src/peer/PeerAddressing.ts';

// Bootstrap node configuration
const BOOTSTRAP_CONFIG = {
  // Node configuration
  nodeId: 'bootstrap-node',
  
  // Connection settings
  connection: {
    // WebSocket server configuration
    wsServer: {
      host: '0.0.0.0',
      port: 9000,
      enabled: true
    },
    
    // Connection settings
    timeout: 30000, // 30 seconds
    maxRetries: 3,
    heartbeatInterval: 10000, // 10 seconds
    
    // Security settings
    enableObfuscation: false,
    enableDirectWebSocket: true, // Enable direct WebSocket connections
    
    // Disable WebRTC for now
    rtcConfig: undefined,
    relayServers: []
  },
  
  // Gossip settings
  gossip: {
    maxHops: 10,
    gossipInterval: 5000, // 5 seconds
    messageTTL: 300000, // 5 minutes
    enableAutoPropagation: true,
    maxConcurrentGossip: 5
  },
  // Obfuscation settings
  obfuscation: {
    // Enable traffic obfuscation
    enabled: false, // Disable for local testing
    // Obfuscation patterns to simulate
    patterns: {
      // Simulate browser-like request patterns
      browserRequests: false,
      // Add random delays to traffic
      randomDelays: false,
      // Modify packet sizes to match common protocols
      packetSizeModification: false,
      // Add fake headers and metadata
      fakeHeaders: false
    },
    // Obfuscation intensity (0-1)
    intensity: 0.5
  },
  // Debug mode
  debug: true,
  // Enable automatic peer discovery
  autoDiscover: true,
  // Maximum number of connections
  maxConnections: 100, // Higher limit for bootstrap node
  // Node ID will be generated automatically
  // isBootstrapNode is not needed as we'll set it in the connection config
};

// Create a new Whispurr node with the bootstrap configuration
const bootstrapNode = new Whispurr(BOOTSTRAP_CONFIG);

// Initialize peer manager
const peerManager = new PeerManager({
  nodeId: 'bootstrap-node',
  maxPeers: BOOTSTRAP_CONFIG.maxConnections,
  connectionTimeout: BOOTSTRAP_CONFIG.connection.timeout,
  pingInterval: BOOTSTRAP_CONFIG.connection.heartbeatInterval
});

// Set up peer manager event listeners
peerManager.on('peer:added', (peer) => {
  console.log(`\n👥 Peer added: ${peer.nodeId}`);
  console.log(`   • Addresses: ${peer.addresses.join(', ')}`);
  console.log(`   • Connected: ${peer.connected ? 'Yes' : 'No'}`);
});

peerManager.on('peer:connected', (peer) => {
  console.log(`\n✅ Peer connected: ${peer.nodeId}`);
  console.log(`   • Connection ID: ${peer.connectionId}`);
  console.log(`   • Connection time: ${new Date(peer.connectionTime || 0).toISOString()}`);
});

peerManager.on('peer:disconnected', (peer, reason) => {
  console.log(`\n❌ Peer disconnected: ${peer.nodeId}`);
  console.log(`   • Reason: ${reason}`);
  console.log(`   • Last seen: ${new Date(peer.lastSeen || 0).toISOString()}`);
});

peerManager.on('peer:error', (peer, error) => {
  console.error(`\n⚠️  Peer error (${peer.nodeId}):`, error);
});

peerManager.on('message', ({ peer, message }) => {
  console.log(`\n📨 Message from ${peer.nodeId}:`, message);
  // Handle different message types here
});

// Start the peer manager
peerManager.start();

// Handle process termination
const shutdown = async () => {
  console.log('\nShutting down bootstrap node...');
  
  // Stop the peer manager
  await peerManager.stop();
  
  // Shutdown the Whispurr node
  await bootstrapNode.shutdown();
  
  console.log('Bootstrap node stopped.');
  Deno.exit(0);
};

// Handle termination signals
const handleSignal = (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  shutdown().catch(console.error);
};

Deno.addSignalListener('SIGINT', () => handleSignal('SIGINT'));
Deno.addSignalListener('SIGTERM', () => handleSignal('SIGTERM'));
  };
};

/**
 * Start the WebSocket server
 */
async function startWebSocketServer(port: number) {
  const handler = async (req: Request): Promise<Response> => {
    // Handle WebSocket upgrade requests
    const upgradeHeader = req.headers.get('upgrade') || '';
    if (upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade request', { status: 426 });
    }
    
    try {
      // Upgrade the connection to a WebSocket
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      // Handle the WebSocket connection
      handleWebSocket(socket, req);
      
      // Return the response to complete the upgrade
      return response;
      
    } catch (error) {
      console.error('❌ Error upgrading WebSocket connection:', error);
      return new Response('Failed to upgrade to WebSocket', { status: 500 });
    }
  };

  // Start the HTTP server with WebSocket support
  console.log(`🚀 Starting WebSocket server on port ${port}...`);
  console.log(`🌐 WebSocket URL: ws://localhost:${port}`);
  
  // Use Deno's native HTTP server
  const server = Deno.listen({ port });
  console.log(`✅ WebSocket server started on ws://localhost:${port}`);
  
  // Handle incoming connections
  (async () => {
    for await (const conn of server) {
      (async () => {
        try {
          // Handle the connection as an HTTP request
          const httpConn = Deno.serveHttp(conn);
          
          for await (const requestEvent of httpConn) {
            try {
              const response = await handler(requestEvent.request);
              await requestEvent.respondWith(response);
            } catch (error) {
              console.error('Error handling request:', error);
              try {
                await requestEvent.respondWith(
                  new Response('Internal Server Error', { status: 500 })
                );
              } catch (e) {
                // Connection may have been closed
                console.error('Failed to send error response:', e);
              }
            }
          }
        } catch (error) {
          console.error('Connection error:', error);
          try {
            conn.close();
          } catch (e) {
            // Ignore
          }
        }
      })();
    }
  })();
  
  return server;
}

// Start the bootstrap node
async function startBootstrapNode() {
  try {
    console.log('🚀 Starting WhispurrNet bootstrap node...');
    
    console.log('🔧 Configuration:', JSON.stringify(BOOTSTRAP_CONFIG, null, 2));
    
    // Initialize the node
    console.log('🔄 Initializing node...');
    await bootstrapNode.initialize();
    
    // Log node information
    const nodeId = bootstrapNode.getNodeId();
    
    console.log('✅ Node initialized successfully');
    console.log('🔑 Bootstrap Node ID:', nodeId);
    
    // Start WebSocket server
    const port = BOOTSTRAP_CONFIG.connection.wsServer?.port || 9000;
    startWebSocketServer(port).catch(console.error);
    
    // Log listening addresses
    console.log('🌐 Listening on:');
    console.log(`  - ws://0.0.0.0:${port}`);
    console.log(`  - ws://localhost:${port}`);
    
    console.log('\nPress Ctrl+C to stop the bootstrap node\n');
    
    // Set up event handlers
    const nodeEmitter = (bootstrapNode as any).node;
    
    nodeEmitter.on('connected', (event: any) => {
      console.log(`🔗 New peer connected: ${event.peer.nodeId}`);
    });
    
    nodeEmitter.on('disconnected', (event: any) => {
      console.log(`❌ Peer disconnected: ${event.peerId} (${event.reason || 'no reason provided'})`);
    });
    
    // Handle incoming messages
    nodeEmitter.on('message', async (event: any) => {
      const message = event.message;
      console.log(`📨 Received ${message.type} message from ${event.peer.nodeId}`);
      
      // Handle PING messages
      if (message.type === MessageType.PING) {
        try {
          const pongMessage = await createMessage(
            MessageType.PONG,
            nodeId,
            JSON.stringify({ timestamp: Date.now() }),
            {
              targetId: message.senderId,
              ttl: 30000,
              whisperTag: 'pong',
              intent: 'pong'
            }
          );
          
          await bootstrapNode.sendMessageToPeer(message.senderId, pongMessage);
          console.log(`🔄 Sent PONG to ${message.senderId}`);
        } catch (error) {
          console.error('❌ Error sending PONG:', error);
        }
      }
    });
    
    nodeEmitter.on('error', (event: any) => {
      console.error('❌ Error:', event.error);
      if (event.peerId) {
        console.error(`  Peer: ${event.peerId}`);
      }
    });
  } catch (error) {
    console.error('❌ Error starting bootstrap node:', error);
  }
}

// Run the bootstrap node
startBootstrapNode();
